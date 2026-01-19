/**
 * Technical Reference Zones — D10.5
 * --------------------------------
 * Purpose:
 * Provide asset-specific, numeric-aware technical context
 * that explains *where price currently sits* relative to
 * historical behavior — without giving advice or instructions.
 *
 * DESIGN PRINCIPLES:
 * - Deterministic
 * - Read-only
 * - No new math
 * - Uses existing tactical signals only
 * - Numeric, transparent, user-facing
 * - Differentiates every asset uniquely
 *
 * THIS IS NOT:
 * - A trading system
 * - Buy/sell advice
 * - A signal generator
 */

function buildTechnicalReferenceZone(input = {}) {
  const {
    symbol,
    price,
    sma200,
    rsi14,
    atrPercent,
    tacticalBreakdown = {},
  } = input;

  if (
    typeof price !== "number" ||
    typeof sma200 !== "number" ||
    typeof rsi14 !== "number" ||
    typeof atrPercent !== "number"
  ) {
    return Object.freeze({
      referenceZone: "UNAVAILABLE",
      contextSummary:
        "Insufficient market data is available to construct a technical reference zone.",
      metrics: {},
      disclaimer:
        "Technical reference zones require complete price and volatility inputs.",
    });
  }

  const distanceFromTrendPct = ((price - sma200) / sma200) * 100;
  const volatilityPct = atrPercent * 100;

  let referenceZone = "NEUTRAL RANGE";
  let contextSummary = "";

  /* =============================
     EXTENSION / OVERHEAT CONTEXT
  ============================== */
  if (rsi14 > 70 && distanceFromTrendPct > 25) {
    referenceZone = "UPPER EXTENSION BAND";
    contextSummary =
      `Price is trading ${distanceFromTrendPct.toFixed(
        1
      )}% above its long-term trend with RSI at ${rsi14.toFixed(
        1
      )}, indicating elevated expectations and stretched positioning relative to historical norms.`;
  }

  /* =============================
     MOMENTUM CONTEXT
  ============================== */
  else if (
    tacticalBreakdown.momentum === 1.0 &&
    distanceFromTrendPct >= 10 &&
    rsi14 >= 55 &&
    rsi14 <= 70
  ) {
    referenceZone = "MOMENTUM ADVANCE RANGE";
    contextSummary =
      `Price is advancing above trend by ${distanceFromTrendPct.toFixed(
        1
      )}% with RSI at ${rsi14.toFixed(
        1
      )}, reflecting sustained upward momentum without extreme overheating.`;
  }

  /* =============================
     ACCUMULATION / DISCOUNT CONTEXT
  ============================== */
  else if (distanceFromTrendPct < -15 && rsi14 < 40) {
    referenceZone = "LOWER ACCUMULATION RANGE";
    contextSummary =
      `Price is trading ${Math.abs(distanceFromTrendPct).toFixed(
        1
      )}% below its long-term trend with RSI at ${rsi14.toFixed(
        1
      )}, suggesting pessimism or neglect rather than structural instability.`;
  }

  /* =============================
     MEAN REVERSION / BALANCED
  ============================== */
  else {
    referenceZone = "BALANCED VALUE RANGE";
    contextSummary =
      `Price is within ${distanceFromTrendPct.toFixed(
        1
      )}% of its long-term trend and RSI at ${rsi14.toFixed(
        1
      )}, indicating market expectations remain broadly aligned with historical behavior.`;
  }

  return Object.freeze({
    referenceZone,
    contextSummary,
    metrics: Object.freeze({
      price,
      sma200,
      rsi14: Number(rsi14.toFixed(1)),
      distanceFromTrendPct: Number(distanceFromTrendPct.toFixed(1)),
      volatilityPct: Number(volatilityPct.toFixed(1)),
    }),
    disclaimer:
      "This technical reference zone describes observed price behavior relative to historical patterns. It does not provide trading instructions or predict future outcomes.",
  });
}

module.exports = Object.freeze({
  buildTechnicalReferenceZone,
});
