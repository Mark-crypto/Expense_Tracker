import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, connection, createUser, removeUsers, request, startServer } from "./helpers.js";

describe("session length", () => {
  let server, api, user;
  const refresh = (cookie) => request(api, "POST", "/auth/refresh", { cookie });
  const signIn = async () => {
    const res = await request(api, "POST", "/auth/login", { body: { email: user.email, password: "TestPass123!" } });
    return {
      res,
      cookie: res.headers.getSetCookie().map((value) => value.split(";")[0]).join("; "),
      token: res.headers.getSetCookie().find((value) => value.startsWith("refreshToken=")).split(";")[0].split("=")[1],
    };
  };

  before(async () => {
    ({ server, api } = await startServer());
    user = await createUser(api);
  });

  after(async () => {
    await removeUsers([user]);
    server.close();
    await closeDatabase();
  });

  it("lasts 12 hours at most, with a 15-minute pass renewed while in use", async () => {
    const { res, cookie } = await signIn();
    const cookies = res.headers.getSetCookie();
    assert.match(cookies.find((value) => value.startsWith("refreshToken=")), /Max-Age=43200/);
    assert.match(cookies.find((value) => value.startsWith("accessToken=")), /Max-Age=900/);
    assert.equal((await refresh(cookie)).status, 200);
  });

  it("ends a sign-in left unused for more than an hour", async () => {
    const { cookie, token } = await signIn();
    await connection.execute("UPDATE refresh_tokens SET last_used_at = ? WHERE token = ?", [Date.now() - 70 * 60 * 1000, token]);
    const idle = await refresh(cookie);
    assert.equal(idle.status, 401);
    assert.equal(idle.body.reason, "idle");
    const [rows] = await connection.execute("SELECT 1 FROM refresh_tokens WHERE token = ?", [token]);
    assert.equal(rows.length, 0);
  });

  it("keeps a sign-in that's in use, and records when it was last used", async () => {
    const { cookie, token } = await signIn();
    await connection.execute("UPDATE refresh_tokens SET last_used_at = ? WHERE token = ?", [Date.now() - 50 * 60 * 1000, token]);
    assert.equal((await refresh(cookie)).status, 200);
    const [[row]] = await connection.execute("SELECT last_used_at FROM refresh_tokens WHERE token = ?", [token]);
    assert.ok(Date.now() - Number(row.last_used_at) < 5000);
  });

  it("ends a sign-in past its 12 hours, however active", async () => {
    const { cookie, token } = await signIn();
    await connection.execute("UPDATE refresh_tokens SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE token = ?", [token]);
    assert.equal((await refresh(cookie)).status, 403);
  });
});
