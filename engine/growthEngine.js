/**
 * Growth Engine (Deterministic, Portfolio-Authoritative)
 * Contract: ALWAYS returns { growthProfile }
 * Authority: Portfolio IPC snapshot
 *
 * Phases:
 * - G2.1 / G2.2 Goal CAGR + Feasibility
 * - G3.1 Asset-weighted CAGR
 * - G4.1 Deterministic What-If
 * - G4.2 Stress Scenarios (math-only)
 */

import { runGoalCagrSolver } from "./growth/goalCagrSolver.js";
import { runAssetWeightedCagrEngine } from "./growth/assetWeightedCagrEngine.js";
import { runScenarioStressEngine } from "./growth/scenarioStressEngine.js";

export async function runGrowthEngine({
  startingValue = 0,
  targetValue = null,
  months = null,
  currency = "CAD",
  timestamp = null,
  authority = "UNKNOWN",
  expectedReturn = 0.10,
  aggressiveReturn = 0.18,
  assetAllocations = null,
  stressConfig = null,
} = {}) {
  /* ----------------------------------
     G2 — Goal-Based CAGR
  ---------------------------------- */
  const goalAnalysis =
    startingValue && targetValue && months
      ? runGoalCagrSolver({
          startingValue,
          targetValue,
          months,
          expectedReturn,
          aggressiveReturn,
        })
      : null;

  /* ----------------------------------
     G3.1 — Asset-Weighted CAGR
  ---------------------------------- */
  const assetCagrAnalysis = Array.isArray(assetAllocations)
    ? runAssetWeightedCagrEngine({ allocations: assetAllocations })
    : null;

  /* ----------------------------------
     G4.2 — Stress Scenarios
  ---------------------------------- */
  const stressAnalysis =
    assetCagrAnalysis?.outputs?.weightedCAGR && months
      ? runScenarioStressEngine({
          startingValue,
          baseCAGR: assetCagrAnalysis.outputs.weightedCAGR,
          months,
          stress: stressConfig || {},
        })
      : null;

  /* ----------------------------------
     Legacy projection (unchanged)
  ---------------------------------- */
  const impliedCAGR = 0.12;

  const projections = Array.from({ length: 5 }).map((_, i) => ({
    year: i + 1,
    value: Math.round(startingValue * Math.pow(1 + impliedCAGR, i + 1)),
  }));

  return {
    growthProfile: {
      startingValue: Math.round(startingValue),
      currency,
      authority,
      timestamp,

      goalAnalysis,
      assetWeightedCAGR: assetCagrAnalysis,
      stressScenarios: stressAnalysis,

      impliedCAGR,
      projections,

      sensitivityNotes: [
        "Stress scenarios apply deterministic math shocks.",
        "No randomness or execution paths exist.",
        "Portfolio remains the sole authority for capital inputs.",
      ],

      narrative:
        "Growth Engine outputs are deterministic, stress-aware, and portfolio-governed.",
    },
  };
}
