/**
 * Volatility Compression Engine — Pre-Expansion Detection
 *
 * Objective:
 * Detect volatility contraction relative to historical norms,
 * which often precedes asymmetric expansion.
 *
 * No breakout logic.
 * No direction bias.
 */

module.exports = function volatilityCompressionEngine(asset = {}) {
  const notes = [];
  let score = 0;

  const market = asset.market || {};
  const volatility = market.volatility || {};

  /* =========================
     REQUIRED DATA
  ========================= */

  const atrCurrent = volatility.atr14;
  const atrHistorical = volatility.atr90;

  if (
    typeof atrCurrent !== "number" ||
    typeof atrHistorical !== "number" ||
    atrHistorical === 0
  ) {
    return {
      score: 0,
      compressed: false,
      notes: ["Insufficient volatility data"]
    };
  }

  /* =========================
     COMPRESSION LOGIC
  ========================= */

  const compressionRatio = atrCurrent / atrHistorical;

  // Mild compression
  if (compressionRatio <= 0.7) {
    score += 10;
    notes.push("Volatility compressed vs historical range");
  }

  // Strong compression (coiled spring)
  if (compressionRatio <= 0.5) {
    score += 10;
    notes.push("Extreme volatility compression detected");
  }

  /* =========================
     PENALTIES
  ========================= */

  // Already expanding volatility
  if (compressionRatio >= 1.1) {
    score -= 10;
    notes.push("Volatility already expanding");
  }

  return {
    score: Math.max(0, Math.min(score, 20)),
    compressed: score >= 10,
    notes
  };
};
