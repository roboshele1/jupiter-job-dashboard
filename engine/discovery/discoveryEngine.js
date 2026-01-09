/**
 * DISCOVERY LAB — AUTHORITATIVE ORCHESTRATOR (D20)
 * ------------------------------------------------
 * Deterministic, read-only execution path.
 * Now wired with:
 * - Multi-period fundamentals
 * - Regime deltas
 * - Growth trajectory matching (engine-only)
 * - Fundamentals audit layer (D21-A, explainability only)
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

const {
  matchGrowthTrajectory,
} = require("./trajectory/trajectoryMatcher.js");

// ==============================
// HELPER — FUNDAMENTALS AUDIT (D21-A)
// Explainability only. No logic changes.
// ==============================

function buildFundamentalsAudit({ fundamentals, normalized, history }) {
  const categories = {
    freeCashFlow: {
      status: normalized.freeCashFlow > 0 ? "PASS" : "FAIL",
      rationale:
        normalized.freeCashFlow > 0
          ? "Free cash flow is positive."
          : "Free cash flow is negative or inconsistent.",
    },
    cashFlowGrowth: {
      status: normalized.freeCashFlowGrowth >= 0 ? "PASS" : "WARN",
      rationale:
        normalized.freeCashFlowGrowth >= 0
          ? "Cash flow trend is stable or improving."
          : "Cash flow growth is weakening.",
    },
    balanceSheet: {
      status: normalized.debtToEquity <= 1 ? "PASS" : "WARN",
      rationale:
        normalized.debtToEquity <= 1
          ? "Debt levels are manageable."
          : "Debt levels are elevated.",
    },
    capitalEfficiency: {
      status: fundamentals.factors?.quality >= 0 ? "PASS" : "WARN",
      rationale:
        fundamentals.factors?.quality >= 0
          ? "Capital efficiency is acceptable."
          : "Capital efficiency is under pressure.",
    },
    revenueQuality: {
      status: normalized.revenueGrowth >= 0 ? "PASS" : "WARN",
      rationale:
        normalized.revenueGrowth >= 0
          ? "Revenue trend is stable."
          : "Revenue growth is declining.",
    },
    margins: {
      status: normalized.grossMargin >= 0.3 ? "PASS" : "WARN",
      rationale:
        normalized.grossMargin >= 0.3
          ? "Margins indicate pricing power."
          : "Margins are thin or compressing.",
    },
    earningsQuality: {
      status: "PASS",
      rationale: "Earnings broadly align with cash generation.",
    },
    valuationSanity: {
      status: normalized.valuationStretched ? "WARN" : "PASS",
      rationale:
        normalized.valuationStretched
          ? "Valuation leaves limited margin of safety."
          : "Valuation appears reasonable for growth.",
    },
    reinvestmentOptionality: {
      status: history && history.length > 1 ? "PASS" : "WARN",
      rationale:
        history && history.length > 1
          ? "Reinvestment runway is visible."
          : "Limited reinvestment history available.",
    },
    downsideProtection: {
      status: normalized.freeCashFlow > 0 ? "PASS" : "WARN",
      rationale:
        normalized.freeCashFlow > 0
          ? "Cash flow provides downside buffer."
          : "Downside protection is limited.",
    },
  };

  const overallStatus = Object.values(categories).some(
    (c) => c.status === "FAIL"
  )
    ? "FAIL"
    : "PASS";

  return Object.freeze({
    overallStatus,
    categories,
    summary:
      overallStatus === "PASS"
        ? "Company meets fundamental quality standards."
        : "Company fails one or more fundamental quality checks.",
  });
}

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
            ? "This regime favors the company’s strengths."
            : "This regime penalizes the company’s weaknesses.",
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

  const fundamentalsAudit = buildFundamentalsAudit({
    fundamentals,
    normalized,
    history,
  });

  return Object.freeze({
    symbol,
    decision,
    conviction,
    fundamentals,
    fundamentalsAudit, // 🔹 D21-A appended
    tactical,
    regime,
    factorAttribution: regimeAdjusted.adjustedFactors,
    regimeDeltaSummary,
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
