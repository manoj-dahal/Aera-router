/**
 * MCP Authorization Scopes — Defines permission scopes for each MCP tool.
 *
 * Each tool requires specific scopes to execute. API keys can be configured
 * with a subset of scopes to limit tool access (least-privilege).
 */

// ============ Scope Definitions ============

/** All available MCP scopes */
export const MCP_SCOPE_LIST = [
  "read:health",
  "read:combos",
  "write:combos",
  "read:quota",
  "read:usage",
  "read:models",
  "execute:completions",
  "execute:search",
  "write:budget",
  "write:resilience",
  "pricing:write",
  "read:cache",
  "write:cache",
  "read:compression",
  "write:compression",
  "read:proxies",
] as const;

export type McpScope = (typeof MCP_SCOPE_LIST)[number];

// ============ Tool → Scope Mapping ============

/** Maps each MCP tool to its required scopes */
export const MCP_TOOL_SCOPES: Record<string, readonly McpScope[]> = {
  // Phase 1: Essential Tools
  aera_router_get_health: ["read:health"],
  aera_router_list_combos: ["read:combos"],
  aera_router_get_combo_metrics: ["read:combos"],
  aera_router_switch_combo: ["write:combos"],
  aera_router_check_quota: ["read:quota"],
  aera_router_route_request: ["execute:completions"],
  aera_router_web_search: ["execute:search"],
  aera_router_web_fetch: ["execute:search"],
  aera_router_cost_report: ["read:usage"],
  aera_router_list_models_catalog: ["read:models"],

  // Phase 2: Advanced Tools
  aera_router_simulate_route: ["read:health", "read:combos"],
  aera_router_set_budget_guard: ["write:budget"],
  aera_router_set_resilience_profile: ["write:resilience"],
  aera_router_test_combo: ["execute:completions", "read:combos"],
  aera_router_get_provider_metrics: ["read:health"],
  aera_router_best_combo_for_task: ["read:combos", "read:health"],
  aera_router_explain_route: ["read:health", "read:usage"],
  aera_router_get_session_snapshot: ["read:usage"],
  aera_router_db_health_check: ["read:health", "write:resilience"],
  aera_router_sync_pricing: ["pricing:write"],
  aera_router_cache_stats: ["read:cache"],
  aera_router_cache_flush: ["write:cache"],
  aera_router_compression_status: ["read:compression"],
  aera_router_compression_configure: ["write:compression"],
  aera_router_set_compression_engine: ["write:compression"],
  aera_router_list_compression_combos: ["read:compression"],
  aera_router_compression_combo_stats: ["read:compression"],
  aera_router_ccr_store: ["write:compression"],
  aera_router_ccr_retrieve: ["read:compression"],
  aera_router_ccr_inspect: ["read:compression"],
  aera_router_ccr_list: ["read:compression"],
  aera_router_ccr_delete: ["write:compression"],
  aera_router_ccr_stats: ["read:compression"],
  aera_router_oneproxy_fetch: ["read:proxies"],
  aera_router_oneproxy_rotate: ["read:proxies"],
  aera_router_oneproxy_stats: ["read:proxies"],

  // Web-session pool observability (read) + lifecycle (write)
  aera_router_pool_status: ["read:health"],
  aera_router_pool_sessions: ["read:health"],
  aera_router_pool_health: ["read:health"],
  aera_router_pool_reset: ["write:resilience"],
  aera_router_pool_warm: ["write:resilience"],
  // Stealth browser pool observability (#3368 PR7)
  aera_router_browser_pool_status: ["read:health"],
} as const;
