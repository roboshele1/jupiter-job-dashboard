// renderer/services/marketMonitorPriceService.js
// JUPITER — Market Monitor Price Service
// Read-only, deterministic, portfolio-authoritative

import { getPortfolioPrices } from "../adapters/portfolioPriceAdapter.js";

/**
 * Market Monitor price fetcher
 * Uses authoritative Portfolio snapshot ONLY
 * No IPC, no network, no side effects
 */
export async function fetchMarketMonitorPrices(holdings) {
  const portfolioPrices = getPortfolioPrices();
  const results = {};

  for (const h of holdings) {
    const symbol = h.symbol;

    if (portfolioPrices[symbol]) {
      results[symbol] = portfolioPrices[symbol];
    } else {
      results[symbol] = {
        ok: false,
        error: "not_in_portfolio_snapshot",
        source: "portfolio"
      };
    }
  }

  return results;
}

