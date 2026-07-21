import test from "node:test";
import assert from "node:assert/strict";
import { AERA_ROUTER_RESPONSE_HEADERS } from "../../src/shared/constants/headers.ts";
import { buildAeraRouterResponseMetaHeaders } from "../../src/domain/aeraRouterResponseMeta.ts";

test("headers constant exposes the fallback-attempts key", () => {
  assert.equal(AERA_ROUTER_RESPONSE_HEADERS.fallbackAttempts, "X-Aera Router-Fallback-Attempts");
});

test("buildAeraRouterResponseMetaHeaders emits the fallback-attempts count when > 0", () => {
  const h = buildAeraRouterResponseMetaHeaders({
    model: "gpt",
    provider: "openai",
    fallbackAttempts: 2,
  });
  assert.equal(h["X-Aera Router-Fallback-Attempts"], "2");
});

test("buildAeraRouterResponseMetaHeaders omits the header when 0 / absent", () => {
  const none = buildAeraRouterResponseMetaHeaders({ model: "gpt" });
  assert.equal(none["X-Aera Router-Fallback-Attempts"], undefined);
  const zero = buildAeraRouterResponseMetaHeaders({ model: "gpt", fallbackAttempts: 0 });
  assert.equal(zero["X-Aera Router-Fallback-Attempts"], undefined);
});
