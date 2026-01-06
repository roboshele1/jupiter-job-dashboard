/**
 * CANDIDATE_ASSET_INJECTION_ENGINE
 * ================================
 * Phase G5.1 — Candidate Asset Injection
 *
 * PURPOSE
 * -------
 * - Measure impact of adding a candidate asset to an existing allocation
 * - Compute delta in weighted CAGR
 *
 * NON-GOALS
 * ---------
 * - No recommendations
 * - No market data
 * - No execution
 * - No mutation
 */

export const CANDIDATE_ASSET_INJECTION_CONTRACT = {
  name: "CANDIDATE_ASSET_INJECTION_ENGINE",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

export function runCandidateAssetInjectionEngine({
  baseAllocations = [],
  candidate = null,
} = {}) {
  if (
    !Array.isArray(baseAllocations) ||
    baseAllocations.length === 0 ||
    !candidate ||
    typeof candidate.amount !== "number" ||
    typeof candidate.assumedCAGR !== "number"
  ) {
    return {
      contract: CANDIDATE_ASSET_INJECTION_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const combined = [...baseAllocations, candidate];

  const totalCapital = combined.reduce(
    (sum, a) => sum + (a.amount || 0),
    0
  );

  if (totalCapital <= 0) {
    return {
      contract: CANDIDATE_ASSET_INJECTION_CONTRACT.name,
      status: "INVALID_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const contributions = combined.map((a) => {
    const weight = a.amount / totalCapital;
    const contribution = weight * a.assumedCAGR;

    return {
      symbol: a.symbol,
      amount: a.amount,
      assumedCAGR: a.assumedCAGR,
      weight,
      contribution,
    };
  });

  const newWeightedCAGR = contributions.reduce(
    (sum, c) => sum + c.contribution,
    0
  );

  const baseWeightedCAGR = baseAllocations.reduce((sum, a) => {
    const baseTotal = baseAllocations.reduce(
      (s, b) => s + (b.amount || 0),
      0
    );
    const weight = a.amount / baseTotal;
    return sum + weight * a.assumedCAGR;
  }, 0);

  return {
    contract: CANDIDATE_ASSET_INJECTION_CONTRACT.name,
    status: "READY",
    outputs: {
      baseWeightedCAGR,
      newWeightedCAGR,
      deltaCAGR: newWeightedCAGR - baseWeightedCAGR,
      totalCapital,
      contributions,
    },
    explanations: [
      "Base CAGR is computed from existing allocations only.",
      "Candidate asset is added as additional capital.",
      "Delta CAGR reflects mathematical impact only.",
      "All CAGRs are explicit assumptions, not forecasts.",
    ],
    timestamp: Date.now(),
  };
}
