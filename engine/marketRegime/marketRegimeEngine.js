/**
 * Market Regime Engine V1
 * ----------------------
 * Determines macro market regime using:
 * - Volatility
 * - Breadth
 * - Trend
 *
 * Node-only. Deterministic. No portfolio access.
 */

export function computeMarketRegime(input) {
  const {
    vixLevel,
    breadthPctAbove50DMA,
    indexTrend
  } = input || {};

  // ===============================
  // Volatility state
  // ===============================
  let volatility = "MODERATE";
  if (typeof vixLevel === "number") {
    if (vixLevel < 18) volatility = "LOW";
    else if (vixLevel > 25) volatility = "HIGH";
  }

  // ===============================
  // Breadth state
  // ===============================
  let breadth = "NEUTRAL";
  if (typeof breadthPctAbove50DMA === "number") {
    if (breadthPctAbove50DMA > 65) breadth = "STRONG";
    else if (breadthPctAbove50DMA < 40) breadth = "WEAK";
  }

  // ===============================
  // Trend state
  // ===============================
  let trend = "SIDEWAYS";
  if (indexTrend === "UP" || indexTrend === "DOWN") {
    trend = indexTrend;
  }

  // ===============================
  // Regime determination
  // ===============================
  let regime = "TRANSITION";

  if (volatility === "LOW" && breadth === "STRONG" && trend === "UP") {
    regime = "RISK_ON";
  } else if (
    volatility === "HIGH" &&
    breadth === "WEAK" &&
    trend === "DOWN"
  ) {
    regime = "RISK_OFF";
  }

  // ===============================
  // Confidence
  // ===============================
  let confidence = "MODERATE";
  if (
    (regime === "RISK_ON" && volatility === "LOW") ||
    (regime === "RISK_OFF" && volatility === "HIGH")
  ) {
    confidence = "HIGH";
  } else if (regime === "TRANSITION") {
    confidence = "LOW";
  }

  return {
    regime,
    signals: {
      volatility,
      breadth,
      trend
    },
    confidence,
    diagnostics: {
      vixLevel,
      breadthPctAbove50DMA,
      indexTrend
    }
  };
}
