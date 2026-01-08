/**
 * MULTI-PERIOD GROWTH COMPUTATION (D16.3)
 * -------------------------------------
 * Computes revenue growth from historical financials.
 * Deterministic. Conservative. No extrapolation.
 */

function computeRevenueGrowth(history = []) {
  if (!Array.isArray(history) || history.length < 2) {
    return {
      growthRate: 0,
      notes: ["Insufficient history for growth computation"],
    };
  }

  // Sort oldest → newest
  const sorted = history
    .slice()
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const oldest = sorted[0]?.financials?.income_statement?.revenues?.value;
  const latest =
    sorted[sorted.length - 1]?.financials?.income_statement?.revenues?.value;

  if (!oldest || !latest || oldest <= 0) {
    return {
      growthRate: 0,
      notes: ["Invalid revenue data in history"],
    };
  }

  const growthRate = (latest - oldest) / oldest;

  return {
    growthRate,
    notes: [],
  };
}

module.exports = Object.freeze({
  computeRevenueGrowth,
});
