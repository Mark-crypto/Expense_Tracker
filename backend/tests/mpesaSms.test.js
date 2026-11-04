import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, createUser, removeUsers, request, startServer } from "./helpers.js";
import { parseMpesaSms } from "../utils/mpesaSms.js";

const SEND =
  "TK12AB34CD Confirmed. Ksh500.00 sent to JOHN DOE 0712345678 on 1/11/26 at 2:15 PM. New M-PESA balance is Ksh1,234.00. Transaction cost, Ksh7.00. Amount you can transact within the day is 499,500.00.";
const PAYBILL =
  "TK12AB34CE Confirmed. Ksh1,000.00 sent to KPLC PREPAID for account 54405123456 on 2/11/26 at 9:05 AM New M-PESA balance is Ksh234.00. Transaction cost, Ksh0.00.";
const TILL = "TK12AB34CF Confirmed. Ksh350.00 paid to NAIVAS SUPERMARKET. on 2/11/26 at 6:40 PM.New M-PESA balance is Ksh884.00.";
const WITHDRAW =
  "TK12AB34CG Confirmed.on 2/11/26 at 1:00 PMWithdraw Ksh2,000.00 from 123456 - Mama Shop Agent New M-PESA balance is Ksh500.00. Transaction cost, Ksh29.00.";
const AIRTIME = "TK12AB34CH confirmed.You bought Ksh100.00 of airtime on 2/11/26 at 8:00 AM.New M-PESA balance is Ksh400.00.";
const RECEIVED = "TK12AB34CJ Confirmed.You have received Ksh3,000.00 from MARY ATIENO 0722000000 on 2/11/26 at 10:00 AM New M-PESA balance is Ksh3,400.00.";

describe("M-Pesa SMS", () => {
  it("reads a send-money message", () => {
    assert.deepEqual(parseMpesaSms(SEND), {
      receiptNo: "TK12AB34CD",
      kind: "send",
      isSpend: true,
      amount: 500,
      merchant: "John Doe",
      account: null,
      date: "2026-11-01",
      balance: 1234,
    });
  });

  it("reads paybill, till, withdrawal and airtime messages", () => {
    const paybill = parseMpesaSms(PAYBILL);
    assert.deepEqual([paybill.kind, paybill.merchant, paybill.account, paybill.amount], ["paybill", "Kplc Prepaid", "54405123456", 1000]);
    assert.deepEqual(
      [TILL, WITHDRAW, AIRTIME].map((text) => {
        const found = parseMpesaSms(text);
        return [found.kind, found.merchant, found.amount];
      }),
      [
        ["till", "Naivas Supermarket", 350],
        ["withdrawal", "Cash withdrawal", 2000],
        ["airtime", "Airtime", 100],
      ]
    );
  });

  it("knows money received isn't spending, and rejects other text", () => {
    assert.equal(parseMpesaSms(RECEIVED).isSpend, false);
    assert.equal(parseMpesaSms("Hello, how are you?"), null);
    assert.equal(parseMpesaSms(""), null);
  });

  describe("in the app", () => {
    let server, api, user;
    const call = (method, path, body) => request(api, method, path, { cookie: user.cookie, body });

    before(async () => {
      ({ server, api } = await startServer());
      user = await createUser(api);
    });

    after(async () => {
      await removeUsers([user]);
      server.close();
      await closeDatabase();
    });

    it("suggests a remembered category and spots a payment already added", async () => {
      await call("POST", "/expenses", {
        amount: 200,
        category: "food",
        date: "2026-10-30",
        merchant: "Naivas Supermarket",
        subcategories: [{ name: "Naivas Supermarket", amount: 200 }],
      });
      const first = await call("POST", "/expenses/parse-sms", { text: TILL });
      assert.equal(first.body.category, "food");
      assert.equal(first.body.duplicate, null);

      const saved = await call("POST", "/expenses", {
        amount: 350,
        category: "food",
        date: "2026-11-02",
        merchant: "Naivas Supermarket",
        receiptNo: "TK12AB34CF",
        subcategories: [{ name: "Naivas Supermarket", amount: 350 }],
      });
      assert.equal(saved.status, 201);

      const again = await call("POST", "/expenses/parse-sms", { text: TILL });
      assert.equal(again.body.duplicate, "2026-11-02");
      const twice = await call("POST", "/expenses", {
        amount: 350,
        category: "food",
        date: "2026-11-02",
        merchant: "Naivas Supermarket",
        receiptNo: "TK12AB34CF",
        subcategories: [{ name: "Naivas Supermarket", amount: 350 }],
      });
      assert.equal(twice.status, 409);
    });

    it("explains when the text isn't a payment message", async () => {
      const res = await call("POST", "/expenses/parse-sms", { text: "Hello" });
      assert.equal(res.status, 422);
    });

    it("lets a later statement take over the SMS payment instead of adding it twice", async () => {
      await call("POST", "/mpesa/save", {
        transactions: [
          {
            receiptNo: "TK12AB34CF",
            occurredAt: "2026-11-02 18:40:00",
            details: "Merchant Payment to NAIVAS SUPERMARKET",
            kind: "till",
            counterparty: "NAIVAS SUPERMARKET",
            category: "food",
            paidIn: 0,
            withdrawn: 350,
            save: true,
          },
        ],
      });
      const { body } = await call("GET", "/expenses?_limit=50");
      const rows = body.data.filter((row) => row.receipt_no === "TK12AB34CF");
      assert.equal(rows.length, 1);
      assert.equal(rows[0].source, "mpesa");
    });
  });
});
