import test from "node:test";
import assert from "node:assert/strict";
import {
  AeraRouterPlugin,
  AERA_ROUTER_PROVIDER_KEY,
  DEFAULT_MODEL_CACHE_TTL_MS,
  resolveAeraRouterPluginOptions,
} from "../src/index.js";

test("scaffold: exports public surface", () => {
  assert.equal(
    typeof AeraRouterPlugin,
    "function",
    "AeraRouterPlugin must be a function (Plugin factory)"
  );
  assert.equal(AERA_ROUTER_PROVIDER_KEY, "aera-router");
  assert.equal(DEFAULT_MODEL_CACHE_TTL_MS, 300_000);
});

test("scaffold: default export is v1 plugin shape { id, server: AeraRouterPlugin }", async () => {
  const mod = await import("../src/index.js");
  assert.equal(typeof mod.default, "object");
  assert.equal(mod.default.id, "@aera-router/opencode-plugin");
  assert.equal(mod.default.server, mod.AeraRouterPlugin);
});

test("resolveAeraRouterPluginOptions: defaults", () => {
  const r = resolveAeraRouterPluginOptions();
  assert.equal(r.providerId, "opencode-aera-router");
  assert.equal(r.displayName, "Aera Router");
  assert.equal(r.modelCacheTtl, 300_000);
  assert.equal(r.baseURL, undefined);
});

test("resolveAeraRouterPluginOptions: custom providerId derives displayName", () => {
  const r = resolveAeraRouterPluginOptions({ providerId: "aera-router-preprod" });
  assert.equal(r.providerId, "opencode-aera-router-preprod");
  assert.equal(r.displayName, "Aera Router (opencode-aera-router-preprod)");
});

test("resolveAeraRouterPluginOptions: explicit displayName wins", () => {
  const r = resolveAeraRouterPluginOptions({
    providerId: "aera-router-x",
    displayName: "Custom Label",
  });
  assert.equal(r.displayName, "Custom Label");
});

test("resolveAeraRouterPluginOptions: invalid TTL falls back to default", () => {
  assert.equal(resolveAeraRouterPluginOptions({ modelCacheTtl: 0 }).modelCacheTtl, 300_000);
  assert.equal(resolveAeraRouterPluginOptions({ modelCacheTtl: -1 }).modelCacheTtl, 300_000);
});

test("resolveAeraRouterPluginOptions: positive TTL respected", () => {
  assert.equal(resolveAeraRouterPluginOptions({ modelCacheTtl: 60_000 }).modelCacheTtl, 60_000);
});

test("AeraRouterPlugin: returns an empty hooks object (scaffold)", async () => {
  const fakeCtx = {} as Parameters<typeof AeraRouterPlugin>[0];
  const hooks = await AeraRouterPlugin(fakeCtx);
  assert.equal(typeof hooks, "object");
  assert.notEqual(hooks, null);
});

test("scaffold: built ESM default export resolves with the v1 plugin shape", async () => {
  // The plugin is ESM-only now — the CJS bundle was dropped to fix the OpenCode
  // loader (#3883), so there is no more ../dist/index.cjs. Validate that the built
  // distributable's default export still carries the OpenCode v1 { id, server } shape.
  const mod = await import("../dist/index.js");
  assert.strictEqual(typeof mod.default, "object");
  assert.strictEqual(mod.default.id, "@aera-router/opencode-plugin");
  assert.strictEqual(typeof mod.default.server, "function");
});
