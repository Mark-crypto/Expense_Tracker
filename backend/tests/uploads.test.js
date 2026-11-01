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
    assert.equal(res.body.expenses.length, 6);
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
    assert.equal(right.body.expenses.length, 6);
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
