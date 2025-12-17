/**
 * Jupiter Insight Pipeline — Phase 2B
 *
 * Purpose:
 * - Pull live market data
 * - Pass it into the Insight Engine
 * - Return structured insights
 *
 * ZERO UI
 * PURE ORCHESTRATION
 */

import { fetchEquityPrice, fetchCryptoPrice } from "./marketData.js";
import { generateInsights } from "./insightEngine.js";

export async function runInsightPipeline({ portfolio, signals, risk }) {
  // --- Live Market Context ---
  const market = {
    trend: "unknown",
    volatility: "stable",
    prices: {},
  };

  try {
    // Core reference assets (can expand later)
    market.prices.NVDA = await fetchEquityPrice("NVDA");
    market.prices.BTC = await fetchCryptoPrice("X:BTCUSD");

    market.trend = "live";
    market.volatility = "dynamic";
  } catch (err) {
    console.warn("Market data unavailable, continuing with partial context.");
  }

  // --- Generate Insights ---
  return await generateInsights({
    portfolio,
    signals,
    risk,
    market,
  });
}

