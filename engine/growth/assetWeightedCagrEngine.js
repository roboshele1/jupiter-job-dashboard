/**
 * ASSET_WEIGHTED_CAGR_ENGINE
 * =========================
 * Phase G3.1 — Asset-weighted CAGR math
 *
 * PURPOSE
 * -------
 * - Compute portfolio CAGR from asset allocations + assumed CAGRs
 * - Attribute contribution per asset
 *
 * NON-GOALS
 * ---------
 * - No recommendations
 * - No market data
 * - No execution
 * - No mutation
 */

export const ASSET_WEIGHTED_CAGR_CONTRACT = {
  name: "ASSET_WEIGHTED_CAGR_ENGINE",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

export function runAssetWeightedCagrEngine({
  allocations = [],
} = {}) {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    return {
      contract: ASSET_WEIGHTED_CAGR_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const totalCapital = allocations.reduce(
    (sum, a) => sum + (a.amount || 0),
    0
  );

  if (totalCapital <= 0) {
    return {
      contract: ASSET_WEIGHTED_CAGR_CONTRACT.name,
      status: "INVALID_INPUTS",
      outputs: null,
      timestamp: Date.now(),
    };
  }

  const contributions = allocations.map((a) => {
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

  const weightedCAGR = contributions.reduce(
    (sum, c) => sum + c.contribution,
    0
  );

  return {
    contract: ASSET_WEIGHTED_CAGR_CONTRACT.name,
    status: "READY",
    outputs: {
      weightedCAGR,
      totalCapital,
      contributions,
    },
    explanations: [
      "Weighted CAGR is the sum of (asset weight × assumed CAGR).",
      "Assumed CAGRs are explicit inputs, not predictions.",
      "No market data or recommendations were used.",
    ],
    timestamp: Date.now(),
  };
}
