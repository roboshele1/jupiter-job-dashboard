/**
 * JUPITER — Portfolio Time Series
 * Activation Phase C — Step 3
 *
 * Maintains in-memory historical snapshots of portfolio value.
 * No disk persistence yet. No execution.
 */

import { getPortfolioTotals } from "./portfolioTotals";

const MAX_POINTS = 288; // e.g., 24h @ 5-min intervals
const series = [];

export async function recordPortfolioSnapshot() {
  const totals = await getPortfolioTotals();

  const snapshot = {
    timestamp: Date.now(),
    marketValue: totals.marketValue,
    pnl: totals.pnl,
  };

  series.push(snapshot);

  if (series.length > MAX_POINTS) {
    series.shift();
  }

  return snapshot;
}

export function getPortfolioTimeSeries() {
  return [...series];
}

/**
 * Metadata
 */
export const PORTFOLIO_TIME_SERIES_META = Object.freeze({
  phase: "Activation Phase C",
  step: 3,
  persistence: "MEMORY_ONLY",
  executionSafe: true,
});

