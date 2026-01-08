/**
 * Confidence Escalation Gate — D12.5
 * ---------------------------------
 * Institutional-grade guardrail preventing premature confidence escalation.
 *
 * This engine does NOT generate confidence.
 * It validates whether a proposed confidence transition is allowed
 * based on persistence, regime stability, and historical confirmation.
 *
 * Logic-only. No execution. No side effects.
 */

const ESCALATION_RULES = {
  HOLD: {
    BUY: { confirmationsRequired: 2 }
  },
  BUY: {
    BUY_MORE: { confirmationsRequired: 3 }
  }
};

const CONFIDENCE_ORDER = ["AVOID", "HOLD", "BUY", "BUY_MORE"];

function isUpgrade(prior, proposed) {
  return (
    CONFIDENCE_ORDER.indexOf(proposed) >
    CONFIDENCE_ORDER.indexOf(prior)
  );
}

function isDowngrade(prior, proposed) {
  return (
    CONFIDENCE_ORDER.indexOf(proposed) <
    CONFIDENCE_ORDER.indexOf(prior)
  );
}

export function applyConfidenceEscalationGate({
  symbol,
  priorConfidence,
  proposedConfidence,
  confidenceHistory = [],
  regime,
  lastRegime
}) {
  // Immediate downgrade is always allowed
  if (isDowngrade(priorConfidence, proposedConfidence)) {
    return Object.freeze({
      symbol,
      approvedConfidence: proposedConfidence,
      blocked: false,
      reason: "Downgrade permitted immediately under risk discipline."
    });
  }

  // No-op or lateral move
  if (priorConfidence === proposedConfidence) {
    return Object.freeze({
      symbol,
      approvedConfidence: priorConfidence,
      blocked: false,
      reason: "No confidence change proposed."
    });
  }

  // Regime change resets escalation
  if (lastRegime && lastRegime !== regime) {
    return Object.freeze({
      symbol,
      approvedConfidence: priorConfidence,
      blocked: true,
      reason: "Regime change detected. Escalation counter reset.",
      requiredConfirmationsRemaining:
        ESCALATION_RULES[priorConfidence]?.[proposedConfidence]
          ?.confirmationsRequired || null
    });
  }

  // Upgrade path validation
  if (isUpgrade(priorConfidence, proposedConfidence)) {
    const rule =
      ESCALATION_RULES[priorConfidence]?.[proposedConfidence];

    if (!rule) {
      return Object.freeze({
        symbol,
        approvedConfidence: priorConfidence,
        blocked: true,
        reason: "Unsupported escalation path."
      });
    }

    const confirmationsSoFar = confidenceHistory.filter(
      (c) => c === proposedConfidence
    ).length;

    if (confirmationsSoFar + 1 < rule.confirmationsRequired) {
      return Object.freeze({
        symbol,
        approvedConfidence: priorConfidence,
        blocked: true,
        reason: "Insufficient consecutive confirmations for escalation.",
        requiredConfirmationsRemaining:
          rule.confirmationsRequired - (confirmationsSoFar + 1)
      });
    }

    return Object.freeze({
      symbol,
      approvedConfidence: proposedConfidence,
      blocked: false,
      reason:
        "Escalation approved after sustained confirmation across evaluations."
    });
  }

  // Fallback safety
  return Object.freeze({
    symbol,
    approvedConfidence: priorConfidence,
    blocked: true,
    reason: "Escalation blocked by default safety rule."
  });
}
