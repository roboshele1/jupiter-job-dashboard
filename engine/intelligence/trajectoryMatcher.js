/**
 * Trajectory Matcher
 * ------------------
 * Compares asset growth vs known hypergrowth archetypes.
 */

export function matchTrajectory(assetSeries, archetypeSeries) {
  if (!assetSeries || !archetypeSeries) return null;

  const score = assetSeries.map((v, i) =>
    i < archetypeSeries.length
      ? Math.abs(v - archetypeSeries[i])
      : 0
  );

  const avgDeviation =
    score.reduce((a, b) => a + b, 0) / score.length;

  return {
    similarityScore: Math.max(0, 100 - avgDeviation),
  };
}

