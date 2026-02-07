/**
 * PORTFOLIO TECHNICAL SIGNALS ENGINE — V1
 *
 * Authority:
 * - Engine-only
 * - Read-only
 * - Deterministic per invocation
 *
 * Flow:
 * price history → metrics → evaluator → ONE state per symbol
 */

import { computeTechnicalMetrics } from "./portfolioTechnicalMetrics.js";
import { buildPortfolioSignal } from "./portfolioSignalEvaluator.js";

export async function buildPortfolioSignalsSnapshot({
  priceBySymbol,
  dailyClosesBySymbol,
  weeklyClosesBySymbol,
  volumesBySymbol,
}) {
  const snapshot = {};
  const asOf = new Date().toISOString();

  for (const symbol of Object.keys(priceBySymbol || {})) {
    const metrics = computeTechnicalMetrics({
      price: priceBySymbol[symbol],
      dailyCloses: dailyClosesBySymbol?.[symbol] || [],
      weeklyCloses: weeklyClosesBySymbol?.[symbol] || [],
      volumes: volumesBySymbol?.[symbol] || [],
    });

    snapshot[symbol] = buildPortfolioSignal(symbol, metrics);
  }

  return Object.freeze({
    contract: "PORTFOLIO_TECHNICAL_SIGNALS_V1",
    asOf,
    signals: Object.freeze(snapshot),
  });
}
