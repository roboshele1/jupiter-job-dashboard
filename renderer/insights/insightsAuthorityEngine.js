/**
 * Insights Authority Engine — V1
 * --------------------------------
 * Single authoritative composer for the Insights tab.
 * Read-only. Renderer-safe. Deterministic.
 *
 * Inputs (consumed, never mutated):
 * - God Mode Insights Engine
 * - Confidence Pipeline + Time Engine
 * - Capital Readiness Engine
 *
 * Output:
 * - One canonical Insights Intelligence Contract
 */

import { runGodModeInsights } from "./godModeInsightsEngine.js";
import { buildConfidenceState } from "./confidencePipeline.js";
import { runCapitalReadinessEngine } from "./capitalReadinessEngine.js";

export function buildInsightsIntelligence(baseData = {}) {
  const generatedAt = Date.now();

  // 1. GOD MODE — structural judgment
  const godMode = runGodModeInsights({
    ...baseData,
    marketRegime: baseData.marketRegime ?? {
      regime: "UNKNOWN",
      confidence: "UNKNOWN"
    }
  });

  // 2. CONFIDENCE — temporal + decay aware
  const confidence = buildConfidenceState();

  // 3. CAPITAL READINESS — gated by confidence + structure
  const capital = runCapitalReadinessEngine({
    confidence,
    regimeImpact: godMode.regimeImpact ?? {
      regime: "UNKNOWN",
      confidence: "UNKNOWN",
      mismatch: "UNKNOWN"
    },
    riskFlags: godMode.riskFlags ?? {}
  });

  // 4. FINAL AUTHORITY CONTRACT
  return {
    meta: {
      engine: "INSIGHTS_AUTHORITY_V1",
      generatedAt
    },

    exposure: godMode.exposure,
    riskFlags: godMode.riskFlags,
    regimeImpact: godMode.regimeImpact,

    confidence,
    capital,

    scenarios: godMode.scenarios,
    invariants: godMode.invariants,

    narrative: godMode.narrative,

    // Explicit guarantees for UI & future scaling
    guarantees: {
      deterministic: true,
      readOnly: true,
      rendererSafe: true,
      noAdvice: true
    }
  };
}
