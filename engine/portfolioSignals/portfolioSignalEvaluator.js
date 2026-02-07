/**
 * PORTFOLIO SIGNAL EVALUATOR — V1
 *
 * Purpose:
 * - Convert technical metrics into ONE explicit action state
 * - Symbol-specific thresholds (no shared logic)
 * - Deterministic, explainable, math-only
 */

import {
  PORTFOLIO_SIGNAL_STATES,
  validatePortfolioSignal
} from "./portfolioSignalsContract.js";

function nowISO() {
  return new Date().toISOString();
}

/**
 * Per-symbol decision logic.
 * This is INTENTIONAL duplication — each asset earns its own rules.
 */
function evaluateSymbol(symbol, metrics) {
  const {
    price,
    sma200w,
    distanceFromSMA200WPercent,
    percentile52w,
    volumeRegime,
    trend
  } = metrics;

  // ---------- NVDA ----------
  if (symbol === "NVDA") {
    if (distanceFromSMA200WPercent <= -5 && trend === "positive") {
      return PORTFOLIO_SIGNAL_STATES.ACCUMULATE;
    }
    if (percentile52w >= 90 && volumeRegime < 0.8) {
      return PORTFOLIO_SIGNAL_STATES.TRIM;
    }
    return PORTFOLIO_SIGNAL_STATES.HOLD;
  }

  // ---------- AVGO ----------
  if (symbol === "AVGO") {
    if (distanceFromSMA200WPercent <= -8) {
      return PORTFOLIO_SIGNAL_STATES.ACCUMULATE;
    }
    if (percentile52w > 95 && trend === "negative") {
      return PORTFOLIO_SIGNAL_STATES.DO_NOT_ADD;
    }
    return PORTFOLIO_SIGNAL_STATES.HOLD;
  }

  // ---------- ASML ----------
  if (symbol === "ASML") {
    if (distanceFromSMA200WPercent <= -10 && volumeRegime > 1.2) {
      return PORTFOLIO_SIGNAL_STATES.ACCUMULATE;
    }
    if (percentile52w > 92) {
      return PORTFOLIO_SIGNAL_STATES.TRIM;
    }
    return PORTFOLIO_SIGNAL_STATES.HOLD;
  }

  // ---------- DEFAULT ----------
  return PORTFOLIO_SIGNAL_STATES.REVIEW_REQUIRED;
}

export function buildPortfolioSignal(symbol, metrics) {
  const signal = {
    symbol,
    state: evaluateSymbol(symbol, metrics),
    metrics,
    asOf: nowISO()
  };

  validatePortfolioSignal(signal);
  return Object.freeze(signal);
}
