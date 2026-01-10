// renderer/adapters/insightsIpcAdapter.js
/**
 * Insights IPC Adapter
 * --------------------
 * Renderer-only adapter that decouples Insights from preload/IPC shape.
 * This module is the ONLY place Insights is allowed to touch window.api.invoke.
 *
 * Rules:
 * - No side effects
 * - No preload changes
 * - No Discovery imports
 * - Deterministic shaping
 */

function assertInvokeAvailable() {
  if (
    typeof window === "undefined" ||
    !window.api ||
    typeof window.api.invoke !== "function"
  ) {
    throw new Error("INSIGHTS_ADAPTER_INVOKE_UNAVAILABLE");
  }
}

export async function fetchInsightsData() {
  assertInvokeAvailable();

  // Fetch raw inputs
  const [portfolioSnapshot, engineInsights] = await Promise.all([
    window.api.invoke("portfolio:getSnapshot"),
    window.api.invoke("insights:compute")
  ]);

  // Defensive normalization
  const safeSnapshot = portfolioSnapshot || null;
  const safeInsights = engineInsights || {};

  return {
    snapshot: safeSnapshot,
    insights: {
      riskPosture: safeInsights.riskPosture ?? "UNKNOWN",
      diversificationScore: safeInsights.diversificationScore ?? "N/A",
      growthTilt: safeInsights.growthTilt ?? "N/A",
      volatilityProxy: safeInsights.volatilityProxy ?? "N/A",
      confidenceBand: safeInsights.confidenceBand ?? "N/A"
    }
  };
}
