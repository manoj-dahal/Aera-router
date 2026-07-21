import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_AERA_ROUTER_BASE_URL,
  resolveAeraRouterBaseUrl,
} from "../../src/shared/utils/resolveAeraRouterBaseUrl.ts";

test("resolveAeraRouterBaseUrl prefers AERA_ROUTER_BASE_URL", () => {
  assert.equal(
    resolveAeraRouterBaseUrl({
      AERA_ROUTER_BASE_URL: "https://internal.example.com/",
      BASE_URL: "https://base.example.com",
      NEXT_PUBLIC_BASE_URL: "https://public.example.com",
    }),
    "https://internal.example.com"
  );
});

test("resolveAeraRouterBaseUrl falls back to BASE_URL", () => {
  assert.equal(
    resolveAeraRouterBaseUrl({
      BASE_URL: "https://base.example.com/",
      NEXT_PUBLIC_BASE_URL: "https://public.example.com",
    }),
    "https://base.example.com"
  );
});

test("resolveAeraRouterBaseUrl falls back to NEXT_PUBLIC_BASE_URL", () => {
  assert.equal(
    resolveAeraRouterBaseUrl({
      NEXT_PUBLIC_BASE_URL: "https://public.example.com/",
    }),
    "https://public.example.com"
  );
});

test("resolveAeraRouterBaseUrl ignores blank values", () => {
  assert.equal(
    resolveAeraRouterBaseUrl({
      AERA_ROUTER_BASE_URL: "   ",
      BASE_URL: "",
      NEXT_PUBLIC_BASE_URL: " https://public.example.com/ ",
    }),
    "https://public.example.com"
  );
});

test("resolveAeraRouterBaseUrl uses the default localhost fallback", () => {
  assert.equal(resolveAeraRouterBaseUrl({}), DEFAULT_AERA_ROUTER_BASE_URL);
});
