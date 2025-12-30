// engine/growthPlanning.js

/**
 * Growth Planning Engine — Phase 4
 *
 * Purpose:
 * - Produce forward-looking, narrative-grade growth paths
 * - Read-only, deterministic, explanatory only
 *
 * Non-goals:
 * - No forecasts
 * - No simulations
 * - No calculations
 * - No portfolio mutation
 * - No IPC
 *
 * Inputs:
 * - snapshot: array of holdings (from snapshotAdapter)
 * - reasoning: portfolio reasoning output (Phase 3)
 *
 * Output:
 * - Structured growth narratives for downstream consumers
 */

export function buildGrowthPlan({ snapshot, reasoning }) {
  if (!snapshot || snapshot.length === 0) {
    return {
      available: false,
      reason: "No portfolio snapshot available",
      paths: [],
    };
  }

  const paths = [];

  // Path 1 — Concentration-driven compounding
  if (reasoning?.concentration?.status === "assessable") {
    paths.push({
      id: "concentration_compounding",
      title: "Concentration-driven compounding",
      description:
        "Portfolio growth is primarily driven by a small number of dominant holdings. Outcomes are sensitive to the performance of top positions.",
      assumptions: [
        "Top holdings continue to outperform or maintain leadership",
        "Capital remains intentionally concentrated",
      ],
      riskProfile: "Asymmetric",
      confidence: "Qualitative",
    });
  }

  // Path 2 — Diversification-led stability
  if (reasoning?.diversification?.status === "assessable") {
    paths.push({
      id: "diversification_stability",
      title: "Diversification-led stability",
      description:
        "Growth emerges from balanced exposure across holdings, reducing reliance on any single position.",
      assumptions: [
        "Capital is spread across multiple contributors",
        "Volatility is moderated through diversification",
      ],
      riskProfile: "Moderate",
      confidence: "Qualitative",
    });
  }

  // Path 3 — Capital efficiency emphasis
  paths.push({
    id: "capital_efficiency",
    title: "Capital efficiency focus",
    description:
      "Growth is shaped by reinvestment discipline and efficient capital deployment rather than position size.",
    assumptions: [
      "Capital is allocated deliberately over time",
      "Reinvestment decisions favor efficiency over speed",
    ],
    riskProfile: "Controlled",
    confidence: "Qualitative",
  });

  return {
    available: true,
    generatedAt: new Date().toISOString(),
    paths,
  };
}

