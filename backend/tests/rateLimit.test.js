import { after, before, it } from "node:test";
import assert from "node:assert/strict";
import { closeDatabase, request, startServer } from "./helpers.js";

let server, api;

before(async () => {
  ({ server, api } = await startServer());
});

after(async () => {
  await closeDatabase();
  server.close();
});

it("blocks login after 10 failed attempts", async () => {
  const attempt = () =>
    request(api, "POST", "/auth/login", {
      body: { email: "nobody@example.com", password: "WrongPass123" },
    });

  for (let count = 0; count < 10; count++) {
    assert.equal((await attempt()).status, 400);
  }
  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.message, /Too many attempts/);
});
