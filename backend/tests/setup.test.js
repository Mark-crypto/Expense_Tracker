import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, createUser, removeUsers, request, startServer } from "./helpers.js";

describe("first-run setup", () => {
  let server, api, user;
  const call = (method, path, body) => request(api, method, path, { cookie: user.cookie, body });
  const setup = async () => (await call("GET", "/setup")).body;

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  after(async () => {
    await removeUsers([user]);
    server.close();
    await closeDatabase();
  });

  it("starts a new sign-up at the beginning with nothing done", async () => {
    const state = await setup();
    assert.equal(state.status, "new");
    assert.equal(state.step, 0);
    assert.equal(state.hidden, false);
    assert.deepEqual(Object.values(state.done), [false, false, false, false, false, false, false]);
  });

  it("counts what was done, wherever it was done", async () => {
    await call("POST", "/accounts", { name: "M-Pesa", type: "mpesa", balance: 1000 });
    await call("PUT", "/accounts/pay-settings", { payType: "irregular", payDay: null, buffer: 1000 });
    await call("POST", "/goals", { name: "Phone", target: 20000 });
    const { done } = await setup();
    assert.deepEqual(done, { statement: false, accounts: true, payDay: true, bills: false, budgets: false, pin: false, goal: true });
  });

  it("remembers the step, finishing, hiding and tips seen", async () => {
    await call("PUT", "/setup", { step: 4 });
    assert.equal((await setup()).step, 4);
    await call("PUT", "/setup", { status: "done" });
    await call("POST", "/setup/hide");
    await call("POST", "/setup/tips", { tip: "budgets" });
    await call("POST", "/setup/tips", { tip: "budgets" });
    const state = await setup();
    assert.equal(state.status, "done");
    assert.equal(state.hidden, true);
    assert.deepEqual(state.tipsSeen, ["budgets"]);

    assert.equal((await call("PUT", "/setup", { status: "new" })).status, 400);
    assert.equal((await call("POST", "/setup/tips", { tip: "nope" })).status, 400);
  });
});
