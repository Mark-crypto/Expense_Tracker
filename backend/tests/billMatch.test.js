import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, removeUsers, request, startServer } from "./helpers.js";
import { matchesBill, sameName } from "../utils/billMatch.js";
import { addDays, today } from "../utils/dates.js";

describe("matching payments to bills", () => {
  it("matches names that share their words, ignoring filler and punctuation", () => {
    assert.equal(sameName("KPLC", "KPLC PREPAID"), true);
    assert.equal(sameName("Netflix", "NETFLIX.COM"), true);
    assert.equal(sameName("Safaricom Home", "SAFARICOM HOME FIBRE LTD"), true);
    assert.equal(sameName("Landlord John Doe", "07•• ••• 678 JOHN DOE"), false);
    assert.equal(sameName("John Doe", "07•• ••• 678 JOHN DOE"), true);
    assert.equal(sameName("KPLC", "Naivas"), false);
    assert.equal(sameName("Co", "Co-op Bank"), false);
  });

  it("needs a believable amount for a set-price bill matched loosely", () => {
    const rent = { name: "Rent", amount: 15000, varies: false };
    assert.equal(matchesBill(rent, "RENT PAYMENT", 15000), true);
    assert.equal(matchesBill(rent, "RENT A CAR", 3000), false);
    assert.equal(matchesBill({ ...rent, varies: true }, "RENT A CAR", 3000), true);
    assert.equal(matchesBill(rent, "Rent", 3000), true, "the exact name always counts");
    assert.equal(matchesBill({ ...rent, aliases: new Set(["mama njeri"]) }, "Mama Njeri", 15000), true);
  });

  describe("in the app", () => {
    let server, api, user;
    const call = (method, path, body) => request(api, method, path, { cookie: user.cookie, body });
    const spend = (merchant, amount, date = today()) =>
      call("POST", "/expenses", { amount, category: "utilities", date, merchant, subcategories: [{ name: merchant, amount }] });
    // Due dates in the past are set directly, since a new bill starts from its next date.
    const track = async (name, amount, nextDue) => {
      const res = await call("POST", "/bills", { name, category: "utilities", amount, frequency: "monthly", nextDue: addDays(today(), 5) });
      await connection.execute("UPDATE recurring_payments SET next_due = ? WHERE user_id = ? AND name = ?", [nextDue, user.id, name]);
      return res;
    };
    const bills = async () => (await call("GET", "/bills")).body;

    before(async () => {
      ({ server, api } = await startServer());
      user = await createUser(api);
    });

    beforeEach(async () => {
      for (const table of ["bill_aliases", "recurring_price_changes", "recurring_payments", "notifications", "expense"]) {
        await connection.execute(`DELETE FROM ${table} WHERE user_id = ?`, [user.id]);
      }
    });

    after(async () => {
      await removeUsers([user]);
      server.close();
      await closeDatabase();
    });

    it("sees a bill as paid when the statement uses a longer name", async () => {
      await spend("KPLC PREPAID", 1750);
      assert.equal((await track("KPLC", 1800, today())).status, 201);
      const { captures, active } = await bills();
      assert.equal(captures.length, 0);
      assert.ok(active[0].next_due > today());
    });

    it("replaces the estimate when the payment arrives under a similar name", async () => {
      await track("Netflix", 1100, addDays(today(), -2));
      assert.equal((await bills()).captures.length, 1);
      await spend("NETFLIX.COM", 1100, addDays(today(), -1));
      assert.equal((await bills()).captures.length, 0);
    });

    it("offers nearby payments, and remembers the one picked for next time", async () => {
      await track("Electricity", 1800, addDays(today(), -3));
      await spend("Mama Njeri Shop", 1790, addDays(today(), -2));
      const [capture] = (await bills()).captures;
      assert.equal(capture.name, "Electricity");
      const candidate = capture.candidates.find((row) => row.name === "Mama Njeri Shop");
      assert.ok(candidate);

      const linked = await call("POST", `/bills/captures/${capture.expense_id}/link`, { paymentId: candidate.id });
      assert.equal(linked.status, 200);
      assert.match(linked.body.message, /Payments to Mama Njeri Shop will count as Electricity/);
      assert.equal((await bills()).captures.length, 0);

      // Next month the same name is recognised straight away.
      const [[bill]] = await connection.execute("SELECT id FROM recurring_payments WHERE user_id = ?", [user.id]);
      const next = addDays(today(), -1);
      await connection.execute("UPDATE recurring_payments SET next_due = ? WHERE id = ?", [next, bill.id]);
      await spend("Mama Njeri Shop", 1810, next);
      assert.equal((await bills()).captures.length, 0);
    });

    it("doesn't suggest a bill that's already tracked under a shorter name", async () => {
      for (const months of [3, 2, 1]) {
        const date = addDays(today(), -30 * months);
        await spend("ZUKU FIBRE LTD", 2999, date);
      }
      assert.equal((await bills()).suggestions.some((row) => /zuku/i.test(row.name)), true);
      await track("Zuku", 2999, addDays(today(), 10));
      assert.equal((await bills()).suggestions.some((row) => /zuku/i.test(row.name)), false);
    });
  });
});
