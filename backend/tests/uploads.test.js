import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  closeDatabase,
  createUser,
  removeUsers,
  request,
  startServer,
} from "./helpers.js";

const fixture = (name) =>
  fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url));

describe("M-Pesa statement upload", () => {
  let server, api, user;

  const upload = async (bytes, password) => {
    const form = new FormData();
    form.append(
      "mpesaStatement",
      new Blob([bytes], { type: "application/pdf" }),
      "statement.pdf"
    );
    if (password) form.append("password", password);
    const res = await fetch(`${api}/upload/mpesa`, {
      method: "POST",
      headers: { cookie: user.cookie },
      body: form,
    });
    return { status: res.status, body: await res.json() };
  };

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  after(async () => {
    await removeUsers([user]);
    await closeDatabase();
    server.close();
  });

  it("reads spending from a statement", async () => {
    const res = await upload(fixture("statement.pdf"));
    assert.equal(res.status, 200);
    assert.equal(res.body.transactions.filter((row) => row.isSpend).length, 6);
    assert.equal(res.body.transactions.length, 9);
  });

  it("builds a report, blocks duplicates and remembers categories", async () => {
    const first = await upload(fixture("statement.pdf"));
    assert.equal(first.body.xray.fees.total, 56);
    assert.equal(first.body.xray.moneyIn, 5000);
    assert.equal(first.body.xray.fuliza.total, 1210);

    const transactions = first.body.transactions.map((row) => ({
      ...row,
      save: row.isSpend,
      category: row.counterparty === "MARY ATIENO" ? "family" : row.category,
    }));
    const save = () =>
      request(api, "POST", "/mpesa/save", {
        cookie: user.cookie,
        body: { transactions },
      });

    assert.equal((await save()).status, 200);
    assert.equal((await save()).status, 200);

    const list = await request(api, "GET", "/expenses?_limit=50", {
      cookie: user.cookie,
    });
    assert.equal(list.body.meta.total, 7);

    const fees = list.body.data.filter((row) => row.receipt_no === "FEES-2026-10");
    assert.equal(fees.length, 1);
    assert.equal(Number(fees[0].amount), 56);
    assert.equal(fees[0].category, "taxes");

    const saved = await request(api, "GET", "/insights/xray", {
      cookie: user.cookie,
    });
    assert.equal(saved.body.xray.moneyOut, Math.round(first.body.xray.moneyOut));
    assert.equal(saved.body.xray.moneyIn, 5000);
    assert.equal(saved.body.xray.costs.rows.find((row) => row.key === "fees").total, 56);

    const second = await upload(fixture("statement.pdf"));
    const spends = second.body.transactions.filter((row) => row.isSpend);
    assert.ok(spends.every((row) => row.alreadyImported));
    assert.equal(
      spends.find((row) => row.counterparty === "MARY ATIENO").category,
      "family"
    );
  });

  it("handles password-protected statements", async () => {
    const locked = fixture("statement-locked.pdf");

    const missing = await upload(locked);
    assert.equal(missing.status, 422);
    assert.equal(missing.body.code, "PASSWORD_REQUIRED");

    const wrong = await upload(locked, "WRONG");
    assert.equal(wrong.body.code, "PASSWORD_INCORRECT");

    const right = await upload(locked, "ABC123");
    assert.equal(right.status, 200);
    assert.equal(right.body.transactions.length, 9);
  });

  it("survives a corrupt file", async () => {
    const res = await upload(Buffer.from("%PDF-1.4\nnot really a pdf"));
    assert.equal(res.status, 422);

    const next = await upload(fixture("statement.pdf"));
    assert.equal(next.status, 200);
  });

  it("requires a file", async () => {
    const res = await request(api, "POST", "/upload/mpesa", { cookie: user.cookie });
    assert.equal(res.status, 400);
  });
});
