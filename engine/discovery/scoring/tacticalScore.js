/**
 * Tactical Score Engine — D1.3.2
 * --------------------------------
 * Contextual, non-trading tactical awareness.
 * Read-only. Deterministic. No state mutation.
 *
 * Output: { score, breakdown }
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function roundDeterministic(x) {
  return Math.round(x * 1000) / 1000;
}

/* =============================
   SUB-SCORE CALCULATIONS
============================= */

function extensionScore(rsi14) {
  if (rsi14 > 70) return 0.2;
  if (rsi14 >= 40 && rsi14 <= 60) return 1.0;
  if (rsi14 < 30) return 0.7;
  return 0.5;
}

function trendDistanceScore(price, sma200) {
  const distance = (price - sma200) / sma200;

  if (distance > 0.25) return 0.2;
  if (distance >= -0.10 && distance <= 0.15) return 1.0;
  if (distance < -0.20) return 0.8;
  return 0.6;
}

function momentumConsistencyScore(m3, m6, m12) {
  const positives = [m3, m6, m12].filter((m) => m > 0).length;

  if (positives === 3) return 1.0;
  if (positives === 0) return 0.3;
  return 0.6;
}

function volatilitySanityScore(atrPercent) {
  if (atrPercent > 0.06) return 0.4;
  if (atrPercent >= 0.02 && atrPercent <= 0.04) return 1.0;
  if (atrPercent < 0.015) return 0.9;
  return 0.7;
}

/* =============================
   TACTICAL SCORE (AGGREGATE)
============================= */

export function computeTacticalScore(inputs) {
  const {
    price,
    sma200,
    rsi14,
    momentum3m,
    momentum6m,
    momentum12m,
    atrPercent,
  } = inputs;

  const ext = extensionScore(rsi14);
  const trend = trendDistanceScore(price, sma200);
  const momentum = momentumConsistencyScore(
    momentum3m,
    momentum6m,
    momentum12m
  );
  const vol = volatilitySanityScore(atrPercent);

  const raw =
    0.30 * ext +
    0.30 * trend +
    0.25 * momentum +
    0.15 * vol;

  const score = roundDeterministic(clamp01(raw));

  return Object.freeze({
    score,
    breakdown: Object.freeze({
      extension: ext,
      trendDistance: trend,
      momentum,
      volatility: vol,
    }),
  });
}
