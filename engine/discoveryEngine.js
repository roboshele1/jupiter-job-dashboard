/**
 * JUPITER — Discovery Engine (Baseline-Compatible)
 * Deterministic, read-only, no side effects
 * Restores legacy export expected by Discovery UI
 */

export function scoreDiscoveryCandidate(candidate, portfolio) {
  // Baseline-safe heuristic
  let score = 50;

  if (!candidate || !portfolio) return score;

  if (candidate.sector && portfolio.sectors?.includes(candidate.sector)) {
    score += 10;
  }

  if (candidate.volatility && candidate.volatility < 0.3) {
    score += 10;
  }

  if (candidate.marketCap && candidate.marketCap > 10_000_000_000) {
    score += 10;
  }

  return Math.min(score, 100);
}

