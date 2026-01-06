/**
 * Growth Engine (Deterministic, Portfolio-Authoritative)
 * Contract: ALWAYS returns { growthProfile }
 * Authority: Portfolio IPC snapshot
 *
 * Phases:
 * - G2.1 / G2.2 Goal CAGR + Feasibility
 * - G3.1 Asset-weighted CAGR
 * - G4.2 Stress Scenarios
 * - G5.2 Candidate Asset Injection
 */

import { runGoalCagrSolver } from "./growth/goalCagrSolver.js";
import { runAssetWeightedCagrEngine } from "./growth/assetWeightedCagrEngine.js";
import { runScenarioStressEngine } from "./growth/scenarioStressEngine.js";
import { runCandidateInjectionEngine } from "./growth/candidate/candidateInjectionEngine.js";

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
  candidateAllocation = null,
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
     G5.2 — Candidate Injection
  ---------------------------------- */
  const candidateInjection =
    assetCagrAnalysis?.outputs &&
    candidateAllocation
      ? runCandidateInjectionEngine({
          baseAllocations: assetAllocations,
          candidateAllocation,
        })
      : null;

  return {
    growthProfile: {
      startingValue: Math.round(startingValue),
      currency,
      authority,
      timestamp,

      goalAnalysis,
      assetWeightedCAGR: assetCagrAnalysis,
      stressScenarios: stressAnalysis,
      candidateInjection,

      sensitivityNotes: [
        "All growth math is deterministic.",
        "Candidate injection is comparison-only.",
        "Portfolio remains the sole authority.",
      ],

      narrative:
        "Growth Engine outputs are deterministic, stress-aware, and discovery-compatible.",
    },
  };
}
