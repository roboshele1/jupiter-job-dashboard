/**
 * LIVE_MARKET_INTELLIGENCE_ENGINE
 * ===============================
 * Phase 25.4 / 26 — Live market facts (read-only)
 *
 * PURPOSE
 * -------
 * - Provide basic, factual market data for a symbol
 * - Stocks, ETFs, crypto supported
 * - SIMPLE_ENGLISH output
 *
 * NON-GOALS
 * ---------
 * - No forecasts
 * - No advice
 * - No execution
 * - No recommendations
 */

export const LIVE_MARKET_INTELLIGENCE_CONTRACT = {
  name: "LIVE_MARKET_INTELLIGENCE",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/**
 * Expected input:
 * {
 *   symbol: string,
 *   marketData: {
 *     price?: number,
 *     changePct?: number,
 *     marketCap?: number,
 *     assetType?: string,
 *     currency?: string
 *   }
 * }
 */

export function runLiveMarketIntelligence({ symbol, marketData } = {}) {
  if (!symbol || !marketData) {
    return {
      contract: LIVE_MARKET_INTELLIGENCE_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intelligence: {
        summary: [
          "No live market data was provided."
        ],
        observations: [],
        risks: [],
        constraints: [
          "Live market intelligence requires a symbol and market data.",
          "No advice or actions are provided."
        ],
      },
      language: "SIMPLE_ENGLISH",
      timestamp: Date.now(),
    };
  }

  const {
    price,
    changePct,
    marketCap,
    assetType = "unknown",
    currency = "USD",
  } = marketData;

  return {
    contract: LIVE_MARKET_INTELLIGENCE_CONTRACT.name,
    status: "READY",
    intelligence: {
      summary: [
        `${symbol} is a ${assetType.toLowerCase()} trading at ${price} ${currency}.`
      ],
      observations: [
        typeof changePct === "number"
          ? `Price change today is ${changePct.toFixed(2)}%.`
          : "Daily price change is unavailable.",
        marketCap
          ? `Market value is approximately ${marketCap}.`
          : "Market value is unavailable.",
      ],
      risks: [
        "Market prices can change quickly."
      ],
      constraints: [
        "This data is factual and time-sensitive.",
        "No predictions or recommendations are provided.",
      ],
    },
    language: "SIMPLE_ENGLISH",
    timestamp: Date.now(),
  };
}
