/**
 * DISCOVERY → GROWTH INTAKE ADAPTER
 * ================================
 * Phase G5.1.2 — Engine-only normalization layer
 *
 * PURPOSE
 * -------
 * - Convert a VALID discovery candidate into Growth Engine–ready input
 * - Enforce strict read-only, deterministic behavior
 *
 * NON-GOALS
 * ---------
 * - No portfolio mutation
 * - No recommendations
 * - No UI logic
 * - No market data
 */

import { validateDiscoveryCandidate } from "../contracts/discoveryCandidateContract.js";

export const DISCOVERY_TO_GROWTH_ADAPTER_CONTRACT = {
  name: "DISCOVERY_TO_GROWTH_ADAPTER",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

export function adaptDiscoveryCandidateToGrowth({
  candidate = null,
  portfolioTotalValue = null,
} = {}) {
  if (!candidate || typeof candidate !== "object") {
    return {
      contract: DISCOVERY_TO_GROWTH_ADAPTER_CONTRACT.name,
      status: "INVALID_INPUT",
      error: "Candidate payload is required.",
      timestamp: Date.now(),
    };
  }

  const validation = validateDiscoveryCandidate(candidate);

  if (validation.status !== "VALID") {
    return {
      contract: DISCOVERY_TO_GROWTH_ADAPTER_CONTRACT.name,
      status: "REJECTED",
      errors: validation.errors,
      timestamp: Date.now(),
    };
  }

  let amount = null;

  if (typeof candidate.proposedAmount === "number") {
    amount = candidate.proposedAmount;
  }

  if (
    typeof candidate.proposedWeight === "number" &&
    typeof portfolioTotalValue === "number"
  ) {
    amount = candidate.proposedWeight * portfolioTotalValue;
  }

  if (typeof amount !== "number" || amount <= 0) {
    return {
      contract: DISCOVERY_TO_GROWTH_ADAPTER_CONTRACT.name,
      status: "INVALID_DERIVATION",
      error: "Unable to derive candidate capital amount.",
      timestamp: Date.now(),
    };
  }

  return {
    contract: DISCOVERY_TO_GROWTH_ADAPTER_CONTRACT.name,
    status: "READY",
    outputs: {
      symbol: candidate.symbol,
      amount: Math.round(amount),
      assumedCAGR: candidate.assumedCAGR,
      source: "DISCOVERY_ENGINE",
    },
    explanations: [
      "Discovery candidate validated before intake.",
      "Capital amount derived deterministically.",
      "Assumed CAGR carried explicitly (no forecasting).",
    ],
    timestamp: Date.now(),
  };
}
