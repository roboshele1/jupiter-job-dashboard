/**
 * GENERAL_MARKET_INTELLIGENCE_ENGINE
 * =================================
 * Phase 18.1 — Non-portfolio finance & market intelligence (Chat V2)
 *
 * PURPOSE
 * -------
 * - Answer general finance, investing, market, and ticker-related questions
 * - Work even when no portfolio snapshot exists
 * - Use simple, plain English suitable for non–finance users
 *
 * NON-GOALS
 * ---------
 * - No advice
 * - No execution
 * - No predictions
 * - No recommendations
 * - No mutation
 * - No LLM calls
 *
 * This engine answers:
 * “What does this financial concept / market / ticker generally mean?”
 */

/* =========================================================
   CONTRACT
========================================================= */

export const GENERAL_MARKET_INTELLIGENCE_CONTRACT = {
  name: "GENERAL_MARKET_INTELLIGENCE",
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
 *   query: string
 * }
 */

/* =========================================================
   OUTPUT SHAPE
========================================================= */
/**
 * Returned structure:
 * {
 *   contract: string,
 *   status: string,
 *   intelligence: {
 *     summary: string[],
 *     observations: string[],
 *     risks: string[],
 *     constraints: string[]
 *   },
 *   language: 'SIMPLE_ENGLISH',
 *   timestamp: number
 * }
 */

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runGeneralMarketIntelligence({ query } = {}) {
  if (!query || typeof query !== "string") {
    return {
      contract: GENERAL_MARKET_INTELLIGENCE_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intelligence: {
        summary: [
          "No question was provided.",
        ],
        observations: [],
        risks: [],
        constraints: [
          "This engine only explains general finance topics.",
          "No advice or actions are provided.",
        ],
      },
      language: "SIMPLE_ENGLISH",
      timestamp: Date.now(),
    };
  }

  // Simple keyword detection (deterministic, no inference)
  const q = query.toLowerCase();

  let summary = [];
  let observations = [];
  let risks = [];

  if (q.includes("stock")) {
    summary.push(
      "A stock represents ownership in a company."
    );
    observations.push(
      "When you buy a stock, you own a small piece of that business."
    );
    risks.push(
      "Stock prices can go up or down based on company performance and market conditions."
    );
  } else if (q.includes("etf")) {
    summary.push(
      "An ETF is a fund that holds many investments in one package."
    );
    observations.push(
      "ETFs often track indexes, sectors, or themes."
    );
    risks.push(
      "ETFs still move with the market and can lose value."
    );
  } else if (q.includes("crypto") || q.includes("bitcoin")) {
    summary.push(
      "Cryptocurrency is a digital asset that operates on blockchain technology."
    );
    observations.push(
      "Bitcoin is the most well-known cryptocurrency."
    );
    risks.push(
      "Crypto prices can be very volatile."
    );
  } else if (q.includes("interest rate")) {
    summary.push(
      "Interest rates represent the cost of borrowing money."
    );
    observations.push(
      "Central banks influence interest rates to manage the economy."
    );
    risks.push(
      "Changes in interest rates can affect stocks, bonds, and borrowing costs."
    );
  } else {
    summary.push(
      "This question relates to finance or markets."
    );
    observations.push(
      "The topic appears to be general in nature and not tied to a specific portfolio."
    );
  }

  return {
    contract: GENERAL_MARKET_INTELLIGENCE_CONTRACT.name,
    status: "READY",
    intelligence: {
      summary,
      observations,
      risks,
      constraints: [
        "This explanation is general and educational only.",
        "No advice or recommendations are given.",
        "Execution is disabled by contract.",
      ],
    },
    language: "SIMPLE_ENGLISH",
    timestamp: Date.now(),
  };
}
