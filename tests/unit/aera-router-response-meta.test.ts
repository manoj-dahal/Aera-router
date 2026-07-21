import test from "node:test";
import assert from "node:assert/strict";

import {
  attachAeraRouterMetaHeaders,
  buildAeraRouterResponseMetaHeaders,
  buildAeraRouterSseMetadataComment,
  formatAeraRouterCost,
  getAeraRouterTokenCounts,
} from "../../src/domain/aeraRouterResponseMeta.ts";
import { APP_CONFIG } from "../../src/shared/constants/appConfig.ts";
import { AERA_ROUTER_RESPONSE_HEADERS } from "../../src/shared/constants/headers.ts";

test("getAeraRouterTokenCounts normalizes common usage shapes", () => {
  assert.deepEqual(
    getAeraRouterTokenCounts({
      prompt_tokens: 12,
      completion_tokens: 5,
    }),
    { input: 12, output: 5 }
  );
  assert.deepEqual(
    getAeraRouterTokenCounts({
      input_tokens: "9",
      output_tokens: "4",
    }),
    { input: 9, output: 4 }
  );
});

test("buildAeraRouterResponseMetaHeaders formats provider alias, tokens, latency, and cost", () => {
  const headers = buildAeraRouterResponseMetaHeaders({
    provider: "claude",
    model: "claude-sonnet-4-6",
    cacheHit: true,
    latencyMs: 1234.6,
    usage: {
      prompt_tokens: 11,
      completion_tokens: 7,
    },
    costUsd: 0.00123456789,
  });

  assert.equal(headers["X-Aera Router-Provider"], "cc");
  assert.equal(headers["X-Aera Router-Model"], "claude-sonnet-4-6");
  assert.equal(headers["X-Aera Router-Cache-Hit"], "true");
  assert.equal(headers["X-Aera Router-Latency-Ms"], "1235");
  assert.equal(headers["X-Aera Router-Tokens-In"], "11");
  assert.equal(headers["X-Aera Router-Tokens-Out"], "7");
  assert.equal(headers["X-Aera Router-Response-Cost"], "0.0012345679");
});

test("buildAeraRouterResponseMetaHeaders keeps ASCII model header values unchanged", () => {
  const headers = buildAeraRouterResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.model], "gpt-4o-mini");
});

test("buildAeraRouterResponseMetaHeaders percent-encodes non-ASCII model header values", () => {
  const model = "free-mix/[假流式]gemini-3.5-flash";
  const headers = buildAeraRouterResponseMetaHeaders({
    provider: "openai",
    model,
  });

  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.model], encodeURIComponent(model));
  assert.doesNotThrow(() => new Headers(headers));
});

test("buildAeraRouterResponseMetaHeaders strips control characters from string header values", () => {
  const headers = buildAeraRouterResponseMetaHeaders({
    provider: "openai",
    model: "free\r\nX-Injected: yes\u0000-model",
    requestId: "req-1\nreq-2\rreq-3\u0007",
  });

  assert.doesNotMatch(headers[AERA_ROUTER_RESPONSE_HEADERS.model], /[\r\n\u0000-\u001f\u007f]/);
  assert.doesNotMatch(headers[AERA_ROUTER_RESPONSE_HEADERS.requestId], /[\r\n\u0000-\u001f\u007f]/);
  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.model], "freeX-Injected: yes-model");
  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.requestId], "req-1req-2req-3");
  assert.doesNotThrow(() => new Headers(headers));
});

test("buildAeraRouterResponseMetaHeaders always emits X-Aera Router-Version", () => {
  const headers = buildAeraRouterResponseMetaHeaders({ provider: "openai", model: "gpt" });
  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.version], APP_CONFIG.version);

  // Even with no provider/model at all, the version is still attached.
  const bare = buildAeraRouterResponseMetaHeaders({});
  assert.equal(bare[AERA_ROUTER_RESPONSE_HEADERS.version], APP_CONFIG.version);
});

test("buildAeraRouterResponseMetaHeaders emits X-Aera Router-Request-Id only when provided", () => {
  const withId = buildAeraRouterResponseMetaHeaders({ model: "gpt", requestId: "req-123" });
  assert.equal(withId[AERA_ROUTER_RESPONSE_HEADERS.requestId], "req-123");

  const noId = buildAeraRouterResponseMetaHeaders({ model: "gpt" });
  assert.equal(noId[AERA_ROUTER_RESPONSE_HEADERS.requestId], undefined);

  const nullId = buildAeraRouterResponseMetaHeaders({ model: "gpt", requestId: null });
  assert.equal(nullId[AERA_ROUTER_RESPONSE_HEADERS.requestId], undefined);

  const blankId = buildAeraRouterResponseMetaHeaders({ model: "gpt", requestId: "   " });
  assert.equal(blankId[AERA_ROUTER_RESPONSE_HEADERS.requestId], undefined);
});

test("attachAeraRouterMetaHeaders mutates a Headers instance in place, preserving existing entries", () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  attachAeraRouterMetaHeaders(headers, {
    provider: "openai",
    model: "gpt",
    requestId: "req-abc",
  });

  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get(AERA_ROUTER_RESPONSE_HEADERS.version), APP_CONFIG.version);
  assert.equal(headers.get(AERA_ROUTER_RESPONSE_HEADERS.requestId), "req-abc");
  assert.equal(headers.get(AERA_ROUTER_RESPONSE_HEADERS.model), "gpt");
});

test("attachAeraRouterMetaHeaders mutates a plain record in place, preserving existing entries", () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  attachAeraRouterMetaHeaders(headers, {
    provider: "openai",
    model: "gpt",
  });

  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.version], APP_CONFIG.version);
  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.model], "gpt");
  // No requestId provided → header omitted.
  assert.equal(headers[AERA_ROUTER_RESPONSE_HEADERS.requestId], undefined);
});

test("buildAeraRouterSseMetadataComment emits comment lines compatible with SSE", () => {
  const comment = buildAeraRouterSseMetadataComment({
    provider: "openai",
    model: "gpt-4o-mini",
    usage: {
      prompt_tokens: 4,
      completion_tokens: 2,
    },
    latencyMs: 50,
    costUsd: formatAeraRouterCost(0),
  });

  assert.match(comment, /^: x-aera-router-cache-hit=false/m);
  assert.match(comment, /^: x-aera-router-provider=openai/m);
  assert.match(comment, /^: x-aera-router-model=gpt-4o-mini/m);
  assert.match(comment, /^: x-aera-router-tokens-in=4/m);
  assert.match(comment, /^: x-aera-router-tokens-out=2/m);
  assert.match(comment, /^: x-aera-router-response-cost=0\.0000000000/m);
});

test("buildAeraRouterResponseMetaHeaders emits X-Aera Router-Cost-Saved only when costSavedUsd is provided", () => {
  // Cache HIT: the incremental cost of serving the hit is 0, but the cache saved the
  // original (would-have-been) cost — surfaced via the Cost-Saved header for analytics.
  const hit = buildAeraRouterResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o",
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0.0125,
  });
  assert.equal(hit[AERA_ROUTER_RESPONSE_HEADERS.responseCost], "0.0000000000");
  assert.equal(hit[AERA_ROUTER_RESPONSE_HEADERS.costSaved], "0.0125000000");

  // A normal response (no costSavedUsd) omits the Cost-Saved header entirely.
  const miss = buildAeraRouterResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o",
    costUsd: 0.0125,
  });
  assert.equal(miss[AERA_ROUTER_RESPONSE_HEADERS.costSaved], undefined);

  // A free-model HIT still emits Cost-Saved (= 0) — it explicitly passed costSavedUsd.
  const freeHit = buildAeraRouterResponseMetaHeaders({
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0,
  });
  assert.equal(freeHit[AERA_ROUTER_RESPONSE_HEADERS.costSaved], "0.0000000000");
});

test("attachAeraRouterMetaHeaders forwards costSavedUsd onto a Headers bag", () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  attachAeraRouterMetaHeaders(headers, {
    provider: "openai",
    model: "gpt-4o",
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0.0125,
  });
  assert.equal(headers.get(AERA_ROUTER_RESPONSE_HEADERS.responseCost), "0.0000000000");
  assert.equal(headers.get(AERA_ROUTER_RESPONSE_HEADERS.costSaved), "0.0125000000");
});
