/**
 * Insights Authority Engine — V3
 * --------------------------------
 * Single authoritative composer for the Insights tab.
 * Adds deterministic decision explanations (WHY layer).
 *
 * Read-only. Renderer-safe. No advice.
 */

import { runGodModeInsights } from "./godModeInsightsEngine.js";
import { buildConfidenceState } from "./confidencePipeline.js";
import { runCapitalReadinessEngine } from "./capitalReadinessEngine.js";

function explainRiskFlags(riskFlags = {}) {
  const explanations = {};

  if (riskFlags.fragility) {
    explanations.fragility =
      riskFlags.fragility === "LOW"
        ? "Portfolio is well-balanced with no dominant concentration risk."
        : riskFlags.fragility === "MODERATE"
        ? "Some concentration exists but remains within acceptable bounds."
        : riskFlags.fragility === "HIGH"
        ? "Capital is heavily concentrated, increasing drawdown sensitivity."
        : "Extreme concentration exposes the portfolio to structural failure risk.";
  }

  if (riskFlags.correlationRisk) {
    explanations.correlationRisk =
      riskFlags.correlationRisk === "LOW"
        ? "Assets exhibit diversified behavior across market conditions."
        : riskFlags.correlationRisk === "MODERATE"
        ? "Partial overlap in asset behavior reduces diversification benefits."
        : "Assets are likely to move together during market stress.";
  }

  if (riskFlags.convictionDrift) {
    explanations.convictionDrift =
      riskFlags.convictionDrift === "ALIGNED"
        ? "Capital deployment matches current confidence signals."
        : "Capital deployed exceeds what current confidence supports.";
  }

  if (riskFlags.regimeMismatch) {
    explanations.regimeMismatch =
      riskFlags.regimeMismatch === "LOW"
        ? "Portfolio structure aligns with the prevailing market regime."
        : "Portfolio posture conflicts with current market regime conditions.";
  }

  return explanations;
}

function explainCapitalDecision(capital, confidence, regimeImpact) {
  const reasons = [];

  if (confidence?.readiness === "NOT_READY") {
    reasons.push("Confidence signals do not support additional capital deployment.");
  }

  if (confidence?.time?.daysInState >= 7) {
    reasons.push(
      `Confidence has persisted in the same state for ${confidence.time.daysInState} days.`
    );
  }

  if (regimeImpact?.regime === "RISK_OFF" && capital.readinessState === "READY") {
    reasons.push(
      "Market regime is risk-off, which typically discourages aggressive deployment."
    );
  }

  if (!reasons.length) {
    reasons.push("No structural or confidence blockers detected.");
  }

  return reasons;
}

export function buildInsightsIntelligence(baseData = {}) {
  const generatedAt = Date.now();

  // 1. Structural judgment
  const godMode = runGodModeInsights({
    ...baseData,
    marketRegime: baseData.marketRegime ?? {
      regime: "UNKNOWN",
      confidence: "UNKNOWN"
    }
  });

  // 2. Confidence (time-aware)
  const confidence = buildConfidenceState();

  // 3. Capital readiness
  const capital = runCapitalReadinessEngine({
    confidence,
    regimeImpact: godMode.regimeImpact ?? {
      regime: "UNKNOWN",
      confidence: "UNKNOWN",
      mismatch: "UNKNOWN"
    },
    riskFlags: godMode.riskFlags ?? {}
  });

  // 4. Explanations (WHY layer)
  const explanations = {
    risk: explainRiskFlags(godMode.riskFlags),
    capital: explainCapitalDecision(capital, confidence, godMode.regimeImpact)
  };

  // 5. Authority contract
  return {
    meta: {
      engine: "INSIGHTS_AUTHORITY_V3",
      generatedAt
    },

    exposure: godMode.exposure,
    riskFlags: godMode.riskFlags,
    regimeImpact: godMode.regimeImpact,

    confidence,
    capital,

    explanations,

    scenarios: godMode.scenarios,
    invariants: godMode.invariants,
    narrative: godMode.narrative,

    guarantees: {
      deterministic: true,
      readOnly: true,
      rendererSafe: true,
      noAdvice: true
    }
  };
}
