/**
 * Tactical Explanation Layer — D10.3B
 * ----------------------------------
 * Purpose:
 * Translate tactical signals into calm, everyday English
 * without altering scores or introducing advice.
 *
 * HARD RULES:
 * - Read-only
 * - Deterministic
 * - No thresholds invented here (must mirror scorer logic)
 * - Language only, no math decisions
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
     RSI (Emotional State)
  ============================== */
  if (rsi14 < 30) {
    explanations.push(
      "The price has been pushed down heavily, suggesting selling pressure may be close to exhaustion."
    );
  } else if (rsi14 >= 40 && rsi14 <= 60) {
    explanations.push(
      "The price is behaving normally, with no strong emotional buying or selling."
    );
  } else if (rsi14 > 70) {
    explanations.push(
      "The price has risen quickly, which can indicate recent buying enthusiasm may be overheated."
    );
  } else {
    explanations.push(
      "The price shows mild emotional behavior, but nothing extreme."
    );
  }

  /* =============================
     Trend Distance (Context)
  ============================== */
  if (price != null && sma200 != null) {
    const distance = (price - sma200) / sma200;

    if (distance > 0.25) {
      explanations.push(
        "The price is far above its long-term average, meaning expectations may be stretched."
      );
    } else if (distance >= -0.10 && distance <= 0.15) {
      explanations.push(
        "The price is close to its long-term trend, suggesting balanced market expectations."
      );
    } else if (distance < -0.20) {
      explanations.push(
        "The price is well below its long-term trend, which may reflect pessimism or neglect."
      );
    } else {
      explanations.push(
        "The price is somewhat away from its long-term trend, but not in an extreme way."
      );
    }
  }

  /* =============================
     Momentum Consistency
  ============================== */
  const positives = [momentum3m, momentum6m, momentum12m].filter(v => v > 0)
    .length;

  if (positives === 3) {
    explanations.push(
      "Momentum has been positive across short-, medium-, and long-term periods."
    );
  } else if (positives === 0) {
    explanations.push(
      "Momentum has been weak across multiple timeframes."
    );
  } else {
    explanations.push(
      "Momentum is mixed, with strength in some periods and weakness in others."
    );
  }

  /* =============================
     Volatility (Risk Environment)
  ============================== */
  if (atrPercent > 0.06) {
    explanations.push(
      "Price swings are large, meaning risk and uncertainty are elevated."
    );
  } else if (atrPercent >= 0.02 && atrPercent <= 0.04) {
    explanations.push(
      "Price movements are steady and within a normal range."
    );
  } else if (atrPercent < 0.015) {
    explanations.push(
      "Price movements are unusually calm, which can occur during consolidation."
    );
  } else {
    explanations.push(
      "Volatility is present but not extreme."
    );
  }

  return Object.freeze({
    summary:
      "Market behavior was reviewed to understand stability and emotional extremes, not to time trades.",
    details: Object.freeze(explanations),
    disclaimer:
      "This explanation describes observed market behavior only. It does not predict future price movement.",
  });
}

module.exports = Object.freeze({
  explainTacticalContext,
});
