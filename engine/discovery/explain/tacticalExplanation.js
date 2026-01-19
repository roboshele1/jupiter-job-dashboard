/**
 * Tactical Explanation Layer — D10.4 (Explainable Signals)
 * -------------------------------------------------------
 * Purpose:
 * Translate tactical signals into asset-specific, numeric-aware
 * explanations that clarify *why* a tactical posture exists.
 *
 * HARD RULES:
 * - Read-only
 * - Deterministic
 * - Mirrors scorer thresholds exactly
 * - No trading instructions
 * - No recommendations
 */

function explainTacticalContext(inputs = {}, scoreOutput = {}) {
  const {
    rsi14,
    price,
    sma200,
    momentum3m,
    momentum6m,
    momentum12m,
    atrPercent,
  } = inputs;

  const breakdown = scoreOutput.breakdown || {};
  const explanations = [];

  /* =============================
     RSI — Emotional Intensity
  ============================== */
  if (typeof rsi14 === "number") {
    if (rsi14 < 30) {
      explanations.push(
        `RSI is ${rsi14.toFixed(1)}, indicating heavy selling pressure that may be approaching exhaustion.`
      );
    } else if (rsi14 >= 40 && rsi14 <= 60) {
      explanations.push(
        `RSI is ${rsi14.toFixed(1)}, reflecting neutral price behavior without emotional extremes.`
      );
    } else if (rsi14 > 70) {
      explanations.push(
        `RSI is ${rsi14.toFixed(1)}, suggesting recent buying enthusiasm may be stretched.`
      );
    } else {
      explanations.push(
        `RSI is ${rsi14.toFixed(1)}, showing mild directional bias without extreme conditions.`
      );
    }
  }

  /* =============================
     Trend Distance — Valuation Context
  ============================== */
  if (typeof price === "number" && typeof sma200 === "number") {
    const distancePct = ((price - sma200) / sma200) * 100;

    if (distancePct > 25) {
      explanations.push(
        `Price is approximately ${distancePct.toFixed(1)}% above its long-term average, indicating elevated expectations relative to trend.`
      );
    } else if (distancePct >= -10 && distancePct <= 15) {
      explanations.push(
        `Price is within ${distancePct.toFixed(1)}% of its long-term trend, suggesting balanced market expectations.`
      );
    } else if (distancePct < -20) {
      explanations.push(
        `Price is roughly ${Math.abs(distancePct).toFixed(1)}% below its long-term trend, reflecting pessimism or reduced interest.`
      );
    } else {
      explanations.push(
        `Price deviates moderately from its long-term trend by ${distancePct.toFixed(1)}%.`
      );
    }
  }

  /* =============================
     Momentum Consistency
  ============================== */
  const momentumValues = [momentum3m, momentum6m, momentum12m].filter(
    (v) => typeof v === "number"
  );

  const positives = momentumValues.filter((v) => v > 0).length;

  if (momentumValues.length === 3) {
    if (positives === 3) {
      explanations.push(
        "Momentum is positive across short-, medium-, and long-term periods, indicating consistent trend strength."
      );
    } else if (positives === 0) {
      explanations.push(
        "Momentum is negative across multiple timeframes, indicating sustained weakness."
      );
    } else {
      explanations.push(
        "Momentum is mixed, with strength present in some periods and weakness in others."
      );
    }
  }

  /* =============================
     Volatility — Risk Environment
  ============================== */
  if (typeof atrPercent === "number") {
    const atrPct = atrPercent * 100;

    if (atrPercent > 0.06) {
      explanations.push(
        `Average price swings are elevated at roughly ${atrPct.toFixed(1)}%, indicating higher uncertainty.`
      );
    } else if (atrPercent >= 0.02 && atrPercent <= 0.04) {
      explanations.push(
        `Price volatility is moderate at approximately ${atrPct.toFixed(1)}%, reflecting a stable trading environment.`
      );
    } else if (atrPercent < 0.015) {
      explanations.push(
        `Price volatility is unusually low at around ${atrPct.toFixed(1)}%, which can occur during consolidation phases.`
      );
    } else {
      explanations.push(
        `Volatility is present at about ${atrPct.toFixed(1)}%, but not at extreme levels.`
      );
    }
  }

  return Object.freeze({
    summary:
      "Tactical signals were evaluated to understand price behavior, trend context, momentum consistency, and risk conditions.",
    details: Object.freeze(explanations),
    disclaimer:
      "This explanation describes observed market conditions only. It does not provide trading instructions or predict future prices.",
  });
}

module.exports = Object.freeze({
  explainTacticalContext,
});
