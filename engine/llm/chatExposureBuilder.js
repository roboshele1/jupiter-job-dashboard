/**
 * Chat Exposure Builder — Phase 16 (Step 3)
 * ----------------------------------------
 * Purpose:
 * - Convert Jupiter interpretation snapshots into observer-safe narrative exposure
 * - Enforce a strict, explicit interpretation contract
 * - Fail safely when inputs are incomplete or malformed
 *
 * This is the ONLY place narrative meaning is constructed.
 *
 * Constraints:
 * - Read-only
 * - Deterministic
 * - No advice
 * - No prediction
 * - No optimization
 * - No UI
 * - No LLM calls
 */

/**
 * Expected interpretation contract (explicit):
 * {
 *   portfolioSummary?: {
 *     concentration?: string
 *   },
 *   riskSummary?: {
 *     primaryDriver?: string
 *   },
 *   growthSummary?: {
 *     alignment?: string
 *   }
 * }
 */

export function buildChatExposure(interpretation) {
  if (!interpretation || typeof interpretation !== "object") {
    return {
      summary:
        "Portfolio interpretation is unavailable or invalid at this time.",
      disclaimer:
        "Observer mode only. No advice or actions implied.",
    };
  }

  const portfolioSummary =
    interpretation.portfolioSummary &&
    typeof interpretation.portfolioSummary === "object"
      ? interpretation.portfolioSummary
      : null;

  const riskSummary =
    interpretation.riskSummary &&
    typeof interpretation.riskSummary === "object"
      ? interpretation.riskSummary
      : null;

  const growthSummary =
    interpretation.growthSummary &&
    typeof interpretation.growthSummary === "object"
      ? interpretation.growthSummary
      : null;

  const summaryParts = [];

  if (portfolioSummary?.concentration) {
    summaryParts.push(
      `Your portfolio is currently concentrated in ${portfolioSummary.concentration}.`
    );
  }

  if (riskSummary?.primaryDriver) {
    summaryParts.push(
      `The primary risk driver identified is ${riskSummary.primaryDriver}.`
    );
  }

  if (growthSummary?.alignment) {
    summaryParts.push(
      `Overall growth alignment remains ${growthSummary.alignment}.`
    );
  }

  if (summaryParts.length === 0) {
    summaryParts.push(
      "Portfolio data is available, but no dominant risk or growth signals are currently elevated."
    );
  }

  return {
    summary: summaryParts.join(" "),
    disclaimer:
      "Observer mode only. Descriptive summary based on current portfolio interpretation. No advice or actions implied.",
  };
}

