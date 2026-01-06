/**
 * SCENARIO_WHAT_IF_ENGINE
 * ======================
 * Phase G4.1 — Deterministic what-if scenarios
 *
 * PURPOSE
 * -------
 * - Normalize portfolio or user-provided allocations
 * - Feed deterministic inputs into asset-weighted CAGR engine
 *
 * NON-GOALS
 * ---------
 * - No recommendations
 * - No forecasts
 * - No execution
 * - No mutation
 */

import {
  runAssetWeightedCagrEngine,
} from "./assetWeightedCagrEngine.js";

export const SCENARIO_WHAT_IF_CONTRACT = {
  name: "SCENARIO_WHAT_IF_ENGINE",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

export function runScenarioWhatIfEngine({
  portfolioSnapshot = null,
  explicitAllocations = null,
  assumedCagrs = {},
} = {}) {
  let allocations = [];

  // ----------------------------------
  // Case 1: Explicit allocations passed
  // ----------------------------------
  if (Array.isArray(explicitAllocations)) {
    allocations = explicitAllocations;
  }

  // ----------------------------------
  // Case 2: Derive allocations from portfolio
  // ----------------------------------
  if (!allocations.length && portfolioSnapshot?.holdings) {
    allocations = portfolioSnapshot.holdings.map((h) => ({
      symbol: h.symbol,
      amount: h.liveValue,
      assumedCAGR: assumedCagrs[h.symbol] ?? null,
    }));
  }

  // ----------------------------------
  // Validate assumed CAGRs
  // ----------------------------------
  const invalid = allocations.some(
    (a) =>
      typeof a.amount !== "number" ||
      typeof a.assumedCAGR !== "number"
  );

  if (invalid) {
    return {
      contract: SCENARIO_WHAT_IF_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  // ----------------------------------
  // Delegate to G3.1 engine
  // ----------------------------------
  const result = runAssetWeightedCagrEngine({
    allocations,
  });

  return {
    contract: SCENARIO_WHAT_IF_CONTRACT.name,
    status: result.status,
    outputs: result.outputs,
    explanations: [
      "Scenario engine normalizes allocations before CAGR computation.",
      "Asset CAGRs are explicit assumptions.",
      "Outputs are deterministic for identical inputs.",
    ],
    timestamp: Date.now(),
  };
}
