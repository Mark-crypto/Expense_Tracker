import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, mails, removeUsers, request, startServer } from "./helpers.js";
import { isWeakPin } from "../utils/security.js";

describe("PIN, password and sign-in protection", () => {
  let server, api, user, other;
  const call = (method, path, body, cookie = user.cookie) => request(api, method, path, { cookie, body });
  // Keeps the sign-in cookies and adds the PIN unlock cookie a response sets.
  const withUnlock = (res, cookie = user.cookie) => {
    const unlock = res.headers.getSetCookie().find((value) => value.startsWith("pinUnlock="));
    return unlock ? `${cookie}; ${unlock.split(";")[0]}` : cookie;
  };
  const mailsTo = (email) => mails.filter((mail) => mail.to === email).map((mail) => mail.subject);

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
    other = await createUser(api);
  });

  after(async () => {
    await removeUsers([user, other]);
    server.close();
    await closeDatabase();
  });

  it("refuses PINs that are easy to guess", () => {
    assert.deepEqual(["0000", "1234", "9876", "1212", "4826"].map(isWeakPin), [true, true, true, true, false]);
  });

  it("lets everything through until a PIN is set, then asks for it", async () => {
    assert.equal((await call("GET", "/accounts")).status, 200);
    assert.equal((await call("POST", "/security/pin", { pin: "1234" })).status, 400);

    const set = await call("POST", "/security/pin", { pin: "4826" });
    assert.equal(set.status, 200);
    assert.deepEqual(mailsTo(user.email), ["You set a PIN"]);
    assert.equal((await call("GET", "/accounts", undefined, withUnlock(set))).status, 200);

    const locked = await call("GET", "/accounts");
    assert.equal(locked.status, 423);
    assert.equal(locked.body.pinRequired, true);
    assert.equal((await call("DELETE", `/profile/${user.id}`)).status, 423);
    assert.equal((await call("POST", "/security/pin", { pin: "5937" })).status, 423);

    const right = await call("POST", "/security/pin/verify", { pin: "4826" });
    assert.equal(right.status, 200);
    assert.ok(right.body.unlockedUntil > Date.now() + 9 * 60 * 1000);
    const { body } = await call("GET", "/security", undefined, withUnlock(right));
    assert.equal(body.pinSet, true);
    assert.ok(body.unlockedUntil);
  });

  it("doesn't let one person's unlock open another person's account", async () => {
    const right = await call("POST", "/security/pin/verify", { pin: "4826" });
    await call("POST", "/security/pin", { pin: "3719" }, other.cookie);
    const stolen = `${other.cookie}; ${withUnlock(right).split("; ").pop()}`;
    assert.equal((await call("GET", "/accounts", undefined, stolen)).status, 423);
  });

  it("locks the PIN after 5 wrong tries, and the password resets it", async () => {
    const first = await call("POST", "/security/pin/verify", { pin: "0001" });
    assert.equal(first.body.triesLeft, 4);
    for (let i = 0; i < 3; i++) await call("POST", "/security/pin/verify", { pin: "0001" });
    const fifth = await call("POST", "/security/pin/verify", { pin: "0001" });
    assert.equal(fifth.status, 429);
    assert.match(fifth.body.message, /PIN locked until \d\d:\d\d/);
    assert.equal((await call("POST", "/security/pin/verify", { pin: "4826" })).status, 429);

    assert.equal((await call("POST", "/security/pin/reset", { password: "wrong", pin: "5937" })).status, 400);
    const reset = await call("POST", "/security/pin/reset", { password: "TestPass123!", pin: "5937" });
    assert.equal(reset.status, 200);
    assert.equal(reset.body.message, "PIN changed.");
    assert.equal((await call("POST", "/security/pin/verify", { pin: "5937" })).status, 200);
    assert.equal((await call("POST", "/security/pin/verify", { pin: "4826" })).status, 400);
  });

  it("changes the password, signs out other devices and emails the owner", async () => {
    const second = await request(api, "POST", "/auth/login", { body: { email: user.email, password: "TestPass123!" } });
    assert.equal(second.status, 200);
    const unlocked = withUnlock(await call("POST", "/security/pin/verify", { pin: "5937" }));

    assert.equal((await call("POST", "/security/password", { current: "nope", next: "NewPass456!" }, unlocked)).status, 400);
    const changed = await call("POST", "/security/password", { current: "TestPass123!", next: "NewPass456!" }, unlocked);
    assert.equal(changed.status, 200);
    const [[{ devices }]] = await connection.execute("SELECT COUNT(*) AS devices FROM refresh_tokens WHERE user_id = ?", [user.id]);
    assert.equal(Number(devices), 1);
    assert.ok(mailsTo(user.email).includes("Your password was changed"));

    const off = await call("DELETE", "/security/pin", undefined, unlocked);
    assert.equal(off.status, 200);
    assert.equal((await call("GET", "/accounts")).status, 200);
  });

  it("locks an email after 5 wrong passwords, whatever network they come from", async () => {
    const tryLogin = (password) => request(api, "POST", "/auth/login", { body: { email: other.email, password } });
    for (let i = 0; i < 4; i++) assert.equal((await tryLogin("wrong-password")).status, 400);
    const fifth = await tryLogin("wrong-password");
    assert.equal(fifth.status, 429);
    assert.match(fifth.body.message, /Try again after \d\d:\d\d/);
    assert.equal((await tryLogin("TestPass123!")).status, 429);
    assert.ok(mailsTo(other.email).includes("Someone tried to sign in to your account"));
  });

  it("sends security headers", async () => {
    const res = await call("GET", "/security");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.ok(res.headers.get("strict-transport-security"));
  });
});
