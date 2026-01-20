/**
 * Optional Momentum Ignition Detector
 * -----------------------------------
 * Detects early momentum ignition AFTER compression,
 * not late-stage trend continuation.
 */

module.exports = function optionalMomentumIgnition(asset, signals = {}) {
  /**
   * Expected signals shape:
   * {
   *   priceStructure: "BASE" | "BREAKOUT" | "EXTENDED",
   *   volatilityExpansion: boolean,
   *   volumeConfirmation: boolean
   * }
   */

  const {
    priceStructure = "BASE",
    volatilityExpansion = false,
    volumeConfirmation = false
  } = signals;

  let score = 0;
  const notes = [];

  if (priceStructure === "BREAKOUT" && volatilityExpansion) {
    score += 5;
    notes.push("Early breakout from base with volatility expansion");
  }

  if (volumeConfirmation) {
    score += 3;
    notes.push("Volume confirms early momentum");
  }

  // Penalize late-stage moves
  if (priceStructure === "EXTENDED") {
    score = 0;
    notes.push("Late-stage extension — momentum ignored");
  }

  return {
    score, // 0–10
    detected: score >= 5,
    notes
  };
};
