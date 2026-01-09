/**
 * DISCOVERY LAB — AUTHORITATIVE ORCHESTRATOR (D20)
 * ------------------------------------------------
 * Deterministic, read-only execution path.
 * Now wired with:
 * - Multi-period fundamentals
 * - Regime deltas
 * - Growth trajectory matching (engine-only)
 */

const { scoreFundamentals } = require("./scoring/fundamentalScore.js");
const { computeTacticalScore } = require("./scoring/tacticalScore.js");

const { classifyRegime } = require("./regime/classifyRegime.js");
const { applyRegimeAdjustments } = require("./regime/scoring/regimeScoreAdjuster.js");

const { classifyDiscoveryDecision } = require("./decision/classifyDecision.js");
const { explainDiscoveryResult } = require("./explain/unifiedDiscoveryExplanation.js");

const {
  getLiveFundamentals,
  getFundamentalsHistory,
} = require("../market/live/liveFundamentalsService.js");

const {
  normalizeFundamentals,
} = require("./scoring/normalizeFundamentals.js");

// 🔹 NEW — Trajectory matcher (append-only)
const {
  matchGrowthTrajectory,
} = require("./trajectory/trajectoryMatcher.js");

// ==============================
// HELPER — REGIME DELTA ANALYSIS
// ==============================

function computeRegimeDeltas({ baseRegime, fundamentals, tactical }) {
  const baseFactors = {
    growth: fundamentals.factors?.growth ?? 0,
    quality: fundamentals.factors?.quality ?? 0,
    risk: fundamentals.factors?.risk ?? 0,
    momentum: tactical.breakdown?.momentum ?? 0,
  };

  const KNOWN_REGIMES = [
    "RISK_ON_GROWTH",
    "TIGHT_MONETARY",
    "INFLATIONARY_EXPANSION",
    "RISK_OFF_DEFENSIVE",
  ];

  const baseAdjusted = applyRegimeAdjustments({
    regime: baseRegime,
    factors: baseFactors,
  });

  const deltas = [];

  KNOWN_REGIMES.forEach((regimeKey) => {
    if (regimeKey === baseRegime) return;

    const adjusted = applyRegimeAdjustments({
      regime: regimeKey,
      factors: baseFactors,
    });

    const delta =
      (adjusted.adjustedFactors.growth +
        adjusted.adjustedFactors.quality -
        adjusted.adjustedFactors.risk +
        adjusted.adjustedFactors.momentum) -
      (baseAdjusted.adjustedFactors.growth +
        baseAdjusted.adjustedFactors.quality -
        baseAdjusted.adjustedFactors.risk +
        baseAdjusted.adjustedFactors.momentum);

    deltas.push(
      Object.freeze({
        regime: regimeKey,
        convictionDelta: Number(delta.toFixed(2)),
        explanation:
          delta > 0
            ? "This regime structurally favors the company’s strongest traits."
            : "This regime structurally penalizes the company’s weakest traits.",
      })
    );
  });

  return Object.freeze({
    baseRegime,
    comparedAgainst: deltas.map((d) => d.regime),
    deltas,
  });
}

// ==============================
// DISCOVERY ENGINE
// ==============================

async function runDiscoveryEngine(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: Discovery engine requires input object");
  }

  const { symbol, ownership = false } = input;

  if (!symbol) {
    throw new Error("MISSING_SYMBOL: Discovery requires a symbol");
  }

  // ---- LIVE FUNDAMENTALS (TTM + HISTORY) ----
  const [ttm, history] = await Promise.all([
    getLiveFundamentals(symbol),
    getFundamentalsHistory(symbol),
  ]);

  const normalized = normalizeFundamentals({ ttm, history });

  const fundamentals = scoreFundamentals({
    financials: {
      income_statement: {
        revenue_growth: normalized.revenueGrowth,
        gross_margin: normalized.grossMargin,
      },
      balance_sheet: {
        debt_to_equity: normalized.debtToEquity,
      },
      cash_flow_statement: {
        free_cash_flow: normalized.freeCashFlow,
      },
    },
  });

  const tactical = computeTacticalScore(input.tactical || {});
  const regime = classifyRegime(input.macro || {});

  const regimeAdjusted = applyRegimeAdjustments({
    regime: regime.label,
    factors: {
      growth: fundamentals.factors?.growth ?? 0,
      quality: fundamentals.factors?.quality ?? 0,
      risk: fundamentals.factors?.risk ?? 0,
      momentum: tactical.breakdown?.momentum ?? 0,
    },
  });

  const regimeDeltaSummary = computeRegimeDeltas({
    baseRegime: regime.label,
    fundamentals,
    tactical,
  });

  // 🔹 NEW — Growth trajectory matching (engine-only)
  const trajectoryMatch = matchGrowthTrajectory({
    symbol,
    fundamentals,
    tactical,
    history,
  });

  const conviction = {
    score: fundamentals.score,
    normalized: fundamentals.score / 10,
  };

  const decision = classifyDiscoveryDecision({
    convictionScore: conviction.score,
    normalized: conviction.normalized,
    ownership,
  });

  return Object.freeze({
    symbol,
    decision,
    conviction,
    fundamentals,
    tactical,
    regime,
    factorAttribution: regimeAdjusted.adjustedFactors,
    regimeDeltaSummary,

    // 🔹 APPENDED OUTPUT
    trajectoryMatch,

    explanation: explainDiscoveryResult({
      symbol,
      decision: decision.decision,
      conviction,
      fundamentals,
      tactical,
      regime,
      attribution: regimeAdjusted.adjustedFactors,
      validation: normalized.notes || null,
    }),
  });
}

module.exports = Object.freeze({
  runDiscoveryEngine,
});
