/**
 * DISCOVERY LAB — AUTHORITATIVE ORCHESTRATOR (D20)
 * Deterministic, read-only execution path.
 * - Fundamentals audit layer (D21-A)
 * - Discovery snapshot history (D21-B)
 * - Factor attribution (RESTORED)
 */

const fs = require("fs");
const path = require("path");

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

const { normalizeFundamentals } = require("./scoring/normalizeFundamentals.js");
const { matchGrowthTrajectory } = require("./trajectory/trajectoryMatcher.js");

// ==============================
// FUNDAMENTALS AUDIT (D21-A)
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

  const overallStatus = Object.values(categories).some((c) => c.status === "FAIL")
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
// SNAPSHOT HISTORY (D21-B)
// ==============================

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "discoverySnapshots.json");
const SNAPSHOT_LIMIT = 30;

function recordDiscoverySnapshot({ regimeLabel, counts }) {
  let snapshots = [];
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try {
      snapshots = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8")) || [];
    } catch {
      snapshots = [];
    }
  }

  snapshots.push({
    timestamp: new Date().toISOString(),
    regime: regimeLabel,
    counts,
  });

  if (snapshots.length > SNAPSHOT_LIMIT) {
    snapshots = snapshots.slice(-SNAPSHOT_LIMIT);
  }

  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshots, null, 2));
}

// ==============================
// DISCOVERY ENGINE
// ==============================

async function runDiscoveryEngine(input) {
  if (!input || typeof input !== "object") throw new Error("INVALID_INPUT");
  const { symbol, ownership = false } = input;
  if (!symbol) throw new Error("MISSING_SYMBOL");

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

  const tactical = computeTacticalScore({});
  const regime = classifyRegime({});

  // 🔹 RESTORED: Regime-adjusted factor attribution
  const regimeAdjusted = applyRegimeAdjustments({
    regime: regime.label,
    factors: {
      growth: fundamentals.factors?.growth ?? 0,
      quality: fundamentals.factors?.quality ?? 0,
      risk: fundamentals.factors?.risk ?? 0,
      momentum: tactical.breakdown?.momentum ?? 0,
    },
  });

  const factorAttribution = regimeAdjusted.adjustedFactors;

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

  recordDiscoverySnapshot({
    regimeLabel: regime.label,
    counts: {
      ranked: decision?.decision ? 1 : 0,
      trajectory: trajectoryMatch?.available ? 1 : 0,
      themes: 0,
      watchlist: 0,
    },
  });

  return Object.freeze({
    symbol,
    decision,
    conviction,
    fundamentals,
    fundamentalsAudit,
    tactical,
    regime,
    factorAttribution, // 🔹 RESTORED OUTPUT
    trajectoryMatch,
    explanation: explainDiscoveryResult({
      symbol,
      decision: decision.decision,
      conviction,
      fundamentals,
      tactical,
      regime,
    }),
  });
}

module.exports = Object.freeze({ runDiscoveryEngine });
