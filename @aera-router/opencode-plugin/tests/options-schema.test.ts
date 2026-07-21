/**
 * T-08 options-schema tests.
 *
 * Covers `parseAeraRouterPluginOptions(opts)` — the strict Zod gate that
 * validates the second-arg `PluginOptions` bag from opencode.json before
 * any hook is wired. Anti-pattern checklist mirrored here:
 *
 *  - `null` / `undefined` must collapse to `{}` (defaults apply downstream).
 *  - Unknown keys must THROW (`.strict()` catches opencode.json typos).
 *  - Validation runs at parse time, not import time (module loads cleanly).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { parseAeraRouterPluginOptions } from "../src/index.js";

test("parseAeraRouterPluginOptions: undefined → {}", () => {
  assert.deepEqual(parseAeraRouterPluginOptions(undefined), {});
});

test("parseAeraRouterPluginOptions: null → {}", () => {
  assert.deepEqual(parseAeraRouterPluginOptions(null), {});
});

test("parseAeraRouterPluginOptions: empty object → {}", () => {
  assert.deepEqual(parseAeraRouterPluginOptions({}), {});
});

test("parseAeraRouterPluginOptions: valid providerId → returns it", () => {
  const r = parseAeraRouterPluginOptions({ providerId: "aera-router-preprod" });
  assert.equal(r.providerId, "aera-router-preprod");
});

test("parseAeraRouterPluginOptions: invalid providerId (special chars) → throws", () => {
  assert.throws(
    () => parseAeraRouterPluginOptions({ providerId: "aera-router prod!" }),
    /providerId.*slug/i
  );
});

test("parseAeraRouterPluginOptions: empty providerId → throws", () => {
  assert.throws(() => parseAeraRouterPluginOptions({ providerId: "" }), /providerId/i);
});

test("parseAeraRouterPluginOptions: valid modelCacheTtl → returns it", () => {
  const r = parseAeraRouterPluginOptions({ modelCacheTtl: 60_000 });
  assert.equal(r.modelCacheTtl, 60_000);
});

test("parseAeraRouterPluginOptions: negative modelCacheTtl → throws", () => {
  assert.throws(() => parseAeraRouterPluginOptions({ modelCacheTtl: -1 }), /modelCacheTtl/i);
});

test("parseAeraRouterPluginOptions: zero modelCacheTtl → throws (positive required)", () => {
  assert.throws(() => parseAeraRouterPluginOptions({ modelCacheTtl: 0 }), /modelCacheTtl/i);
});

test("parseAeraRouterPluginOptions: invalid baseURL (not a URL) → throws", () => {
  assert.throws(() => parseAeraRouterPluginOptions({ baseURL: "not-a-url" }), /baseURL/i);
});

test("parseAeraRouterPluginOptions: unknown key → throws (strict mode catches typos)", () => {
  assert.throws(
    () =>
      parseAeraRouterPluginOptions({
        providerId: "aera-router",
        provider_id: "typo-here",
      }),
    /provider_id|unrecognized/i
  );
});

test("parseAeraRouterPluginOptions: all four fields populated correctly → returns them", () => {
  const opts = {
    providerId: "aera-router-prod",
    displayName: "Aera Router Production",
    modelCacheTtl: 120_000,
    baseURL: "https://or.example.com/v1",
  };
  const r = parseAeraRouterPluginOptions(opts);
  assert.deepEqual(r, opts);
});

test("parseAeraRouterPluginOptions: error message lists every issue path", () => {
  // Two bad fields at once → error string should mention BOTH.
  try {
    parseAeraRouterPluginOptions({
      providerId: "",
      baseURL: "garbage",
    });
    assert.fail("expected throw");
  } catch (err) {
    const msg = (err as Error).message;
    assert.match(msg, /providerId/);
    assert.match(msg, /baseURL/);
  }
});

test("parseAeraRouterPluginOptions: module import alone does NOT throw", async () => {
  // Re-importing the entry must not trigger validation; validation only fires
  // on explicit parseAeraRouterPluginOptions / AeraRouterPlugin invocation.
  const mod = await import("../src/index.js");
  assert.equal(typeof mod.parseAeraRouterPluginOptions, "function");
});
