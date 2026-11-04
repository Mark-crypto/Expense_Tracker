import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { closeDatabase, createUser, removeUsers, request, startServer } from "./helpers.js";
import { currentMonth, shiftMonth } from "../utils/budgetStatus.js";
import { today } from "../utils/dates.js";

describe("choosing a budget and exporting a period", () => {
  let server, api, user, other;
  const call = (method, path, body, who = user) => request(api, method, path, { cookie: who.cookie, body });
  const spentIn = async (name) => {
    const { body } = await call("GET", "/budgets/overview");
    return body.budgets.find((budget) => budget.name === name)?.spent;
  };
  const expense = (extra) => ({
    amount: 1000,
    category: "food",
    date: today(),
    merchant: "Java House",
    subcategories: [{ name: "Java House", amount: 1000 }],
    ...extra,
  });

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
    other = await createUser(api);
    await call("POST", "/budgets/plan", {
      rows: [
        { category: "food", name: "food", amount: 9000 },
        { category: "entertainment", name: "going out", amount: 4000 },
      ],
    });
  });

  after(async () => {
    await removeUsers([user, other]);
    server.close();
    await closeDatabase();
  });

  it("lists the budgets an expense can count toward", async () => {
    const { body } = await call("GET", "/expenses/quick-add");
    assert.deepEqual(body.budgetList.map((budget) => budget.name).sort(), ["food", "going out"]);
    assert.ok(body.budgets.food.id);
  });

  it("counts an expense toward the budget picked, not its category's", async () => {
    const goingOut = (await call("GET", "/expenses/quick-add")).body.budgetList.find((budget) => budget.name === "going out");
    assert.equal((await call("POST", "/expenses", expense({ budgetId: goingOut.id }))).status, 201);
    assert.equal(await spentIn("going out"), 1000);
    assert.equal(await spentIn("food"), 0);

    // Without a choice, the category decides.
    await call("POST", "/expenses", expense({ amount: 500, subcategories: [{ name: "Java House", amount: 500 }] }));
    assert.equal(await spentIn("food"), 500);
  });

  it("ignores a budget that belongs to someone else", async () => {
    const theirs = (await call("POST", "/budgets/plan", { rows: [{ category: "travel", name: "their trip", amount: 100 }] }, other)).status;
    assert.equal(theirs, 200);
    const theirId = (await call("GET", "/expenses/quick-add", undefined, other)).body.budgetList[0].id;
    await call("POST", "/expenses", expense({ amount: 200, budgetId: theirId, subcategories: [{ name: "Java House", amount: 200 }] }));
    assert.equal(await spentIn("food"), 700);
    const { body } = await call("GET", "/budgets/overview", undefined, other);
    assert.equal(body.budgets[0].spent, 0);
  });

  it("exports budgets month by month for the period asked", async () => {
    const to = currentMonth();
    const from = shiftMonth(to, -2);
    const res = await fetch(`${api}/budget/report?from=${from}-01&to=${to}-28`, { headers: { cookie: user.cookie } });
    assert.match(res.headers.get("content-disposition"), new RegExp(`budgets-${from}-to-${to}\\.xlsx`));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await res.arrayBuffer()));
    const rows = workbook.getWorksheet("Budgets").getSheetValues().slice(2);
    // The budgets were made this month, so earlier months have no rows.
    assert.deepEqual(rows.map((row) => row[1]), [to, to]);
    const food = rows.find((row) => row[2] === "food");
    assert.deepEqual([food[5], food[6], food[7], food[8]], [9000, 700, 8300, "Within"]);
  });

  it("exports only the expenses in the period asked", async () => {
    await call("POST", "/expenses", expense({ date: `${shiftMonth(currentMonth(), -3)}-10` }));
    const from = `${currentMonth()}-01`;
    const res = await fetch(`${api}/expenses/report?from=${from}&to=${today()}`, { headers: { cookie: user.cookie } });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await res.arrayBuffer()));
    assert.equal(workbook.worksheets[0].actualRowCount - 1, 3);
  });
});
