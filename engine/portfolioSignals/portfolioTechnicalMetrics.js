/**
 * PORTFOLIO TECHNICAL METRICS — V1
 *
 * Responsibilities:
 * - Compute numeric technical metrics per symbol
 * - No decisions, no thresholds, no language
 * - Deterministic and reproducible
 */

function sma(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function percentileRank(value, range) {
  if (!Array.isArray(range) || range.length === 0) return null;
  const below = range.filter(v => v <= value).length;
  return (below / range.length) * 100;
}

function distancePercent(current, reference) {
  if (!reference || reference === 0) return null;
  return ((current - reference) / reference) * 100;
}

function trendDirection(smaShort, smaLong) {
  if (smaShort == null || smaLong == null) return "neutral";
  if (smaShort > smaLong) return "positive";
  if (smaShort < smaLong) return "negative";
  return "neutral";
}

export function computeTechnicalMetrics({
  price,
  dailyCloses,
  weeklyCloses,
  volumes,
}) {
  const sma50d = sma(dailyCloses, 50);
  const sma200w = sma(weeklyCloses, 200);
  const percentile52w = percentileRank(
    price,
    dailyCloses.slice(-252)
  );

  const avgVolume = sma(volumes, 20);
  const volumeRegime = avgVolume
    ? volumes[volumes.length - 1] / avgVolume
    : null;

  return Object.freeze({
    price,
    sma50d,
    sma200w,
    distanceFromSMA200WPercent: distancePercent(price, sma200w),
    percentile52w,
    volumeRegime,
    trend: trendDirection(sma50d, sma200w),
  });
}
