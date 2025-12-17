/**
 * JUPITER — Portfolio Performance Contract
 * Activation Phase C — Step 4
 *
 * Canonical interface exposing live valuation, totals,
 * and time-series performance to downstream consumers.
 * Read-only. No execution.
 */

import { getLivePortfolioValuation } from "./portfolioValuation";
import { getPortfolioTotals } from "./portfolioTotals";
import { getPortfolioTimeSeries } from "./portfolioTimeSeries";

export async function getPortfolioPerformance() {
  const [rows, totals] = await Promise.all([
    getLivePortfolioValuation(),
    getPortfolioTotals(),
  ]);

  return {
    rows,
    totals,
    timeSeries: getPortfolioTimeSeries(),
    timestamp: Date.now(),
  };
}

/**
 * Contract metadata
 */
export const PORTFOLIO_PERFORMANCE_META = Object.freeze({
  version: "1.0.0",
  phase: "Activation Phase C",
  step: 4,
  live: true,
  mutable: false,
  description:
    "Authoritative portfolio performance contract (valuation, totals, time series).",
});

