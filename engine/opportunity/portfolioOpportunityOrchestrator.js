// engine/opportunity/portfolioOpportunityOrchestrator.js
// -----------------------------------------------------
// Portfolio-aware Opportunity Orchestrator
// Primary alert source (replaces generic drift dominance)
//
// Contract:
// - Consumes Discovery surfaced results
// - Applies portfolio weighting (60% sensitivity boost)
// - Emits STRONG BUY / BUY / HOLD / TRIM / EXIT
// - Deterministic, read-only, append-only
// -----------------------------------------------------

const { runDiscoveryScan } = require("../discovery/runDiscoveryScan.js");

// -----------------------------
// PORTFOLIO PRIORITY LIST
// -----------------------------
const PORTFOLIO_PRIORITY = new Set([
  "NVDA",
  "ASML",
  "AVGO",
  "MSTR",
  "HOOD",
  "BMNR",
  "APLD",
  "BTC",
  "ETH",
  "NOW"
]);

// -----------------------------
// WEIGHTING CONFIG
// -----------------------------
const WEIGHTING = Object.freeze({
  portfolioMultiplier: 1.6,
  universeMultiplier: 1.0
});

// -----------------------------
// ACTION THRESHOLDS
// -----------------------------
const THRESHOLDS = Object.freeze({
  STRONG_BUY: 0.80,
  BUY: 0.65,
  HOLD: 0.50,
  TRIM: 0.40
});

// -----------------------------
// ACTION CLASSIFIER
// -----------------------------
function classifyAction(asset, weightedConviction) {
  if (weightedConviction >= THRESHOLDS.STRONG_BUY) return "STRONG BUY";
  if (weightedConviction >= THRESHOLDS.BUY) return "BUY";
  if (weightedConviction >= THRESHOLDS.HOLD) return "HOLD";
  if (weightedConviction >= THRESHOLDS.TRIM) return "TRIM";
  return "EXIT";
}

// -----------------------------
// ALERT BUILDER
// -----------------------------
function buildOpportunityAlert(asset, weightedConviction, action) {
  return {
    type: "OPPORTUNITY_SIGNAL",
    symbol: asset.symbol,
    action,
    conviction: Number(weightedConviction.toFixed(3)),
    rank: asset.rank,
    regime: asset.regime?.label || "UNKNOWN",
    trajectory: asset.trajectoryMatch?.label || null,
    source: PORTFOLIO_PRIORITY.has(asset.symbol)
      ? "PORTFOLIO"
      : "DISCOVERY",
    timestamp: Date.now()
  };
}

// -----------------------------
// MAIN ORCHESTRATOR
// -----------------------------
async function runPortfolioOpportunityOrchestrator() {
  const discovery = await runDiscoveryScan();
  const surfaced = discovery?.canonical || [];

  if (!surfaced.length) return [];

  const alerts = [];

  surfaced.forEach(asset => {
    const baseConviction = asset?.conviction?.normalized || 0;

    const multiplier = PORTFOLIO_PRIORITY.has(asset.symbol)
      ? WEIGHTING.portfolioMultiplier
      : WEIGHTING.universeMultiplier;

    // CLAMPED conviction (0 → 1) to keep scoring stable
    const weightedConviction = Math.min(1, baseConviction * multiplier);

    const action = classifyAction(asset, weightedConviction);

    alerts.push(buildOpportunityAlert(asset, weightedConviction, action));
  });

  return alerts;
}

module.exports = Object.freeze({
  runPortfolioOpportunityOrchestrator
});
