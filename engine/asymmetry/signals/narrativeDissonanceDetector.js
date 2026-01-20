/**
 * Narrative Dissonance Detector
 * -----------------------------
 * Identifies contradiction between price behavior and prevailing narrative.
 */

module.exports = function narrativeDissonanceDetector(asset, signals = {}) {
  /**
   * Expected signals shape:
   * {
   *   priceTrend: "UP" | "DOWN" | "FLAT",
   *   narrativeBias: "BULLISH" | "BEARISH" | "NEUTRAL",
   *   volumeTrend: "ACCUMULATING" | "DISTRIBUTING" | "FLAT",
   *   analystCoverage: "INCREASING" | "DECREASING" | "NONE"
   * }
   */

  const {
    priceTrend = "FLAT",
    narrativeBias = "NEUTRAL",
    volumeTrend = "FLAT",
    analystCoverage = "NONE"
  } = signals;

  let score = 0;
  const notes = [];

  // Price up, narrative bearish
  if (priceTrend === "UP" && narrativeBias === "BEARISH") {
    score += 6;
    notes.push("Price rising against bearish narrative");
  }

  // Accumulation without positive narrative
  if (volumeTrend === "ACCUMULATING" && narrativeBias !== "BULLISH") {
    score += 5;
    notes.push("Stealth accumulation despite neutral/negative narrative");
  }

  // Coverage absent or declining while behavior improves
  if (analystCoverage !== "INCREASING" && priceTrend === "UP") {
    score += 4;
    notes.push("Improving behavior without analyst validation");
  }

  // Strongest signal: all three align
  if (
    priceTrend === "UP" &&
    volumeTrend === "ACCUMULATING" &&
    narrativeBias === "BEARISH"
  ) {
    score += 5;
    notes.push("Maximum narrative dissonance detected");
  }

  return {
    score, // 0–20
    detected: score >= 6,
    notes
  };
};
