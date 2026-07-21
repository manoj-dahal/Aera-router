export type ServerLifecyclePhase = "starting" | "ready" | "stopping";

declare global {
  var __aeraRouterServerLifecycle: ServerLifecyclePhase | undefined;
}

export function getServerLifecyclePhase(): ServerLifecyclePhase {
  return globalThis.__aeraRouterServerLifecycle ?? "starting";
}

export function markServerStarting(): void {
  globalThis.__aeraRouterServerLifecycle = "starting";
}

export function markServerReady(): void {
  if (getServerLifecyclePhase() !== "stopping") {
    globalThis.__aeraRouterServerLifecycle = "ready";
  }
}

export function markServerStopping(): void {
  globalThis.__aeraRouterServerLifecycle = "stopping";
}
