// renderer/engine/riskScoringEngine.js

/**
 * Risk Scoring Engine (V9 Step 1)
 * Read-only, deterministic, snapshot-derived
 */

/**
 * @param {Array} holdings - normalized snapshot holdings
 * @returns {Object} riskScores keyed by symbol
 */
export function deriveRiskScores(holdings = []) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return {};
  }

  const scores = {};

  holdings.forEach(h => {
    const weight = h.weight || 0; // already percent-based (0–100)
    const isCrypto = h.assetClass === "crypto";

    // Base risk from concentration
    let score = weight * 1.2;

    // Crypto volatility premium
    if (isCrypto) score += 10;

    // Cap score
    score = Math.min(Math.round(score), 100);

    scores[h.symbol] = {
      symbol: h.symbol,
      assetClass: h.assetClass,
      weight,
      riskScore: score
    };
  });

  return scores;
}

