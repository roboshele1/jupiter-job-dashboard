// engine/opportunity/portfolioReinforcementEngine.js
// -------------------------------------------------------
// JUPITER — PORTFOLIO REINFORCEMENT ENGINE (UNIFIED ACTION LADDER)
//
// PURPOSE:
// Produce a deterministic reinforcement state for EVERY portfolio asset
// using one standardized institutional action ladder:
//
// STRONG BUY → BUY → ACCUMULATE → HOLD → WEAKENING → EXIT
//
// No silent assets.
// No mixed vocabularies.
// Every cycle prints a uniform state.
// -------------------------------------------------------

const { runDiscoveryScan } = require("../discovery/runDiscoveryScan.js");

// -----------------------------
// ACTION LADDER MAPPING
// -----------------------------
function mapScoreToAction(score = 0) {
  if (score >= 0.85) return "STRONG BUY";
  if (score >= 0.70) return "BUY";
  if (score >= 0.55) return "ACCUMULATE";
  if (score >= 0.40) return "HOLD";
  if (score >= 0.20) return "WEAKENING";
  return "EXIT";
}

// -----------------------------
// SAFE NUMBERS
// -----------------------------
function safeNum(v) {
  if (v === undefined || v === null) return 0;
  if (Number.isNaN(v)) return 0;
  return Number(v);
}

// -----------------------------
// MAIN ENGINE
// -----------------------------
async function runPortfolioReinforcementEngine() {
  const discovery = await runDiscoveryScan();

  // Pull ALL evaluated portfolio + discovery assets
  const ranked =
    discovery?.canonical ||
    [];

  // If discovery canonical is empty, fallback to rejected + preview
  const fallbackUniverse = [
    ...(discovery?.canonical || []),
    ...(discovery?.preview || []),
    ...(discovery?.rejected || [])
  ];

  const source = ranked.length ? ranked : fallbackUniverse;

  const reinforcement = source.map(asset => {

    const conviction = safeNum(asset?.conviction?.normalized);
    const trajectoryScore = safeNum(asset?.trajectoryMatch?.score);
    const fundamentals = safeNum(asset?.fundamentals?.score) / 10;

    // Composite reinforcement math (pure deterministic)
    const reinforcementScore =
      (conviction * 0.5) +
      (trajectoryScore * 0.3) +
      (fundamentals * 0.2);

    const action = mapScoreToAction(reinforcementScore);

    return Object.freeze({
      symbol: asset.symbol,

      signal: action,

      reinforcementScore: Number(reinforcementScore.toFixed(3)),

      conviction: conviction,

      regime: asset?.regime?.label || "UNKNOWN",

      trajectory: asset?.trajectoryMatch?.label || null
    });
  });

  // Sort strongest → weakest
  reinforcement.sort((a, b) => b.reinforcementScore - a.reinforcementScore);

  // Return TOP 5 portfolio reinforcement signals
  return reinforcement.slice(0, 5);
}

module.exports = Object.freeze({
  runPortfolioReinforcementEngine
});
