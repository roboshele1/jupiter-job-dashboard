/**
 * LIVE_MARKET_INTELLIGENCE_ENGINE
 * ===============================
 * Phase 21.1 — Chat V2 live market intelligence (API-agnostic)
 *
 * PURPOSE
 * -------
 * - Explain live market and ticker data already provided to Chat
 * - Work with equities, ETFs, crypto, or indexes
 * - Use SIMPLE ENGLISH for non-finance users
 *
 * NON-GOALS
 * ---------
 * - No API calls
 * - No data fetching
 * - No execution
 * - No advice
 * - No predictions
 * - No mutation
 *
 * This engine answers:
 * “What does this live market data mean?”
 */

/* =========================================================
   CONTRACT
========================================================= */

export const LIVE_MARKET_INTELLIGENCE_CONTRACT = {
  name: "LIVE_MARKET_INTELLIGENCE",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INPUT SHAPE
========================================================= */
/**
 * Expected input:
 * {
 *   symbol?: string,
 *   marketData?: {
 *     price?: number,
 *     changePercent?: number,
 *     volume?: number,
 *     marketCap?: number,
 *     timestamp?: number
 *   }
 * }
 */

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runLiveMarketIntelligence({ symbol, marketData } = {}) {
  if (!symbol || !marketData) {
    return {
      contract: LIVE_MARKET_INTELLIGENCE_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intelligence: {
        summary: ["No live market data was provided."],
        observations: [],
        risks: [],
        constraints: [
          "Live market explanation requires symbol and market data.",
          "No advice or actions are provided.",
        ],
      },
      language: "SIMPLE_ENGLISH",
      timestamp: Date.now(),
    };
  }

  const summary = [];
  const observations = [];
  const risks = [];

  summary.push(
    `${symbol} is currently trading at ${marketData.price ?? "an unknown price"}.`
  );

  if (typeof marketData.changePercent === "number") {
    observations.push(
      `The price has changed by ${marketData.changePercent}% recently.`
    );

    if (Math.abs(marketData.changePercent) > 5) {
      risks.push("Large price moves can mean higher short-term risk.");
    }
  }

  if (marketData.volume) {
    observations.push(
      `There is active trading volume in this asset.`
    );
  }

  return {
    contract: LIVE_MARKET_INTELLIGENCE_CONTRACT.name,
    status: "READY",
    intelligence: {
      summary,
      observations,
      risks,
      constraints: [
        "This explanation is descriptive only.",
        "No advice or recommendations are given.",
        "Execution is disabled by contract.",
      ],
    },
    language: "SIMPLE_ENGLISH",
    timestamp: Date.now(),
  };
}
