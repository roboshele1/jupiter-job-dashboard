/**
 * DISCOVERY_CANDIDATE_CONTRACT
 * ===========================
 * Phase G5.1.1 — Discovery → Growth handoff
 *
 * PURPOSE
 * -------
 * - Define the ONLY allowed structure for Discovery-proposed assets
 * - Enable Growth Engine to evaluate hypothetical impact
 * - Preserve Portfolio as capital authority
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No recommendations
 * - No mutation
 * - No portfolio overrides
 */

export const DISCOVERY_CANDIDATE_CONTRACT = {
  name: "DISCOVERY_CANDIDATE_CONTRACT",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "DISCOVERY",
  acceptedBy: "GROWTH_ENGINE",
};

/**
 * Expected payload shape:
 *
 * {
 *   symbol: string,                // e.g. "MSTR"
 *   assumedCAGR: number,           // explicit assumption (0.25 = 25%)
 *   proposedAmount?: number,       // optional dollar allocation
 *   proposedWeight?: number,       // optional weight (0–1)
 *   source: "DISCOVERY_ENGINE",
 *   confidenceNote?: string        // optional metadata (non-binding)
 * }
 *
 * RULES:
 * - Exactly ONE of proposedAmount OR proposedWeight may be provided
 * - Growth engine must normalize against Portfolio authority
 * - Missing capital inputs are rejected
 */

export function validateDiscoveryCandidate(candidate = {}) {
  const errors = [];

  if (!candidate || typeof candidate !== "object") {
    errors.push("Candidate must be an object.");
  }

  if (!candidate.symbol || typeof candidate.symbol !== "string") {
    errors.push("Candidate symbol is required.");
  }

  if (
    typeof candidate.assumedCAGR !== "number" ||
    candidate.assumedCAGR <= 0
  ) {
    errors.push("assumedCAGR must be a positive number.");
  }

  const hasAmount = typeof candidate.proposedAmount === "number";
  const hasWeight = typeof candidate.proposedWeight === "number";

  if (hasAmount && hasWeight) {
    errors.push("Provide either proposedAmount OR proposedWeight, not both.");
  }

  if (!hasAmount && !hasWeight) {
    errors.push("Either proposedAmount or proposedWeight must be provided.");
  }

  if (
    hasWeight &&
    (candidate.proposedWeight <= 0 || candidate.proposedWeight >= 1)
  ) {
    errors.push("proposedWeight must be between 0 and 1.");
  }

  if (candidate.source !== "DISCOVERY_ENGINE") {
    errors.push("source must be DISCOVERY_ENGINE.");
  }

  return {
    contract: DISCOVERY_CANDIDATE_CONTRACT.name,
    status: errors.length === 0 ? "VALID" : "INVALID",
    errors,
    timestamp: Date.now(),
  };
}
