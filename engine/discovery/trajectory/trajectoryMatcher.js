/**
 * GROWTH TRAJECTORY MATCHER — D20
 * --------------------------------
 * Compares current fundamentals + tactical posture
 * against known historical growth trajectories
 * (e.g. NVDA, NFLX, AMZN early-phase).
 *
 * Read-only. Deterministic. No prediction.
 */

function matchGrowthTrajectory({ symbol, fundamentals, tactical, history }) {
  if (!fundamentals || !tactical) {
    return Object.freeze({
      available: false,
      reason: "Insufficient data for trajectory analysis",
    });
  }

  const growth = fundamentals.factors?.growth ?? 0;
  const quality = fundamentals.factors?.quality ?? 0;
  const momentum = tactical.breakdown?.momentum ?? 0;

  let label = "NO_MATCH";
  let score = 0;

  if (growth >= 2 && quality >= 2 && momentum >= 0.25) {
    label = "EARLY_COMPOUNDER_LIKE";
    score = 0.75;
  } else if (growth >= 1.5 && momentum >= 0.2) {
    label = "EMERGING_GROWTH";
    score = 0.55;
  }

  return Object.freeze({
    available: true,
    label,
    score,
    confidence: score, // 🔹 D21-C: promoted confidence (0–1)
    explanation:
      label === "EARLY_COMPOUNDER_LIKE"
        ? "Fundamentals and momentum resemble early-stage compounders before mainstream adoption."
        : label === "EMERGING_GROWTH"
        ? "The asset shows signs of early growth acceleration but lacks full compounding characteristics."
        : "Current data does not resemble known historical growth trajectories.",
  });
}

module.exports = Object.freeze({
  matchGrowthTrajectory,
});
