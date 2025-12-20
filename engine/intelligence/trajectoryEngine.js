/**
 * Trajectory Engine
 * -----------------
 * Normalizes and compares growth curves.
 */

export function compareTrajectory(series, archetype) {
  if (!series || series.length < 2) return { score: 0, confidence: "low" };

  const normSeries = series.map(v => v / series[0]);
  const minLen = Math.min(normSeries.length, archetype.length);

  let diff = 0;
  for (let i = 0; i < minLen; i++) {
    diff += Math.abs(normSeries[i] - archetype[i]);
  }

  const score = Math.max(0, 100 - diff * 20);

  return {
    score: Math.round(score),
    confidence: score > 70 ? "high" : score > 40 ? "medium" : "low",
  };
}

