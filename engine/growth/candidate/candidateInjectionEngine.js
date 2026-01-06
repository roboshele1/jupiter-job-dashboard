/**
 * CANDIDATE_INJECTION_ENGINE
 * =========================
 * Phase G5.2 — Engine-only candidate asset injection
 *
 * PURPOSE
 * -------
 * - Compare base portfolio CAGR vs injected candidate scenario
 * - Pure math delta (no recommendations)
 *
 * INPUTS
 * ------
 * - baseAllocations: existing asset allocations
 * - candidateAllocation: normalized candidate asset
 *
 * OUTPUTS
 * -------
 * - baseWeightedCAGR
 * - newWeightedCAGR
 * - deltaCAGR
 */

import { runAssetWeightedCagrEngine } from "../assetWeightedCagrEngine.js";

export const CANDIDATE_INJECTION_CONTRACT = {
  name: "CANDIDATE_ASSET_INJECTION_ENGINE",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

export function runCandidateInjectionEngine({
  baseAllocations = [],
  candidateAllocation = null,
} = {}) {
  if (!Array.isArray(baseAllocations) || !candidateAllocation) {
    return {
      contract: CANDIDATE_INJECTION_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const baseResult = runAssetWeightedCagrEngine({
    allocations: baseAllocations,
  });

  if (baseResult.status !== "READY") {
    return {
      contract: CANDIDATE_INJECTION_CONTRACT.name,
      status: "INVALID_BASE_ALLOCATIONS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const injectedAllocations = [
    ...baseAllocations,
    candidateAllocation,
  ];

  const injectedResult = runAssetWeightedCagrEngine({
    allocations: injectedAllocations,
  });

  if (injectedResult.status !== "READY") {
    return {
      contract: CANDIDATE_INJECTION_CONTRACT.name,
      status: "INVALID_INJECTION",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  return {
    contract: CANDIDATE_INJECTION_CONTRACT.name,
    status: "READY",
    outputs: {
      baseWeightedCAGR: baseResult.outputs.weightedCAGR,
      newWeightedCAGR: injectedResult.outputs.weightedCAGR,
      deltaCAGR:
        injectedResult.outputs.weightedCAGR -
        baseResult.outputs.weightedCAGR,
      totalCapital: injectedResult.outputs.totalCapital,
      contributions: injectedResult.outputs.contributions,
    },
    explanations: [
      "Base CAGR computed from existing allocations only.",
      "Candidate asset injected as additional capital.",
      "Delta CAGR reflects pure mathematical impact.",
      "No forecasts, advice, or execution paths.",
    ],
    timestamp: Date.now(),
  };
}
