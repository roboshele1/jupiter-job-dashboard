// engine/signals/signalsEngine.js
// Signals Engine V3 — Confidence + Context + Delta (RESTORED)
// Deterministic, read-only, no execution authority

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

function classifyImpact(pct = 0) {
  if (pct <= -0.05) return "High";
  if (pct <= -0.02) return "Moderate";
  return "Low";
}

function classifyMomentum(deltaPct = 0) {
  if (deltaPct > 0.03) return "Strong";
  if (deltaPct < -0.03) return "Weak";
  return "Neutral";
}

function classifyMeanReversion(deltaPct = 0) {
  if (deltaPct > 0.05) return "Overextended";
  if (deltaPct < -0.05) return "Oversold";
  return "Neutral";
}

function classifyContext(deltaPct = 0) {
  if (deltaPct <= -0.05) return "ACCUMULATION_ZONE";
  if (deltaPct >= 0.05) return "DISTRIBUTION_ZONE";
  return "NEUTRAL";
}

function computeDelta(deltaPct = 0) {
  if (deltaPct > 0) return "↑";
  if (deltaPct < 0) return "↓";
  return "→";
}

export function buildSignalsSnapshot({
  confidenceEvaluations = [],
  portfolio = {}
} = {}) {
  const timestamp = Date.now();
  const signals = [];

  // ------------------------------
  // PORTFOLIO AGGREGATE (SYSTEM POSTURE)
  // ------------------------------
  const portfolioConfidence =
    confidenceEvaluations.find(c => c.symbol === "PORTFOLIO")
      ?.confidenceTransition?.nextConfidence || "Low";

  signals.push({
    symbol: "PORTFOLIO",
    assetClass: "aggregate",
    momentum: "-",
    meanReversion: "-",
    portfolioImpact: "Low",
    confidence: portfolioConfidence,
    confidenceRank: CONFIDENCE_ORDER[portfolioConfidence],
    delta: "→",
    context: "NEUTRAL"
  });

  // ------------------------------
  // PER-ASSET SIGNALS
  // ------------------------------
  const positions = Array.isArray(portfolio.positions)
    ? portfolio.positions
    : [];

  for (const p of positions) {
    const evalResult = confidenceEvaluations.find(
      e => e.symbol === p.symbol
    );

    const nextConf =
      evalResult?.confidenceTransition?.nextConfidence || "Low";

    const deltaPct = p.deltaPct ?? 0;

    signals.push({
      symbol: p.symbol,
      assetClass: p.assetClass,
      momentum: classifyMomentum(deltaPct),
      meanReversion: classifyMeanReversion(deltaPct),
      portfolioImpact: classifyImpact(deltaPct),
      confidence: nextConf,
      confidenceRank: CONFIDENCE_ORDER[nextConf],
      delta: computeDelta(deltaPct),
      context: classifyContext(deltaPct)
    });
  }

  return {
    timestamp,
    signals,
    notifications: []
  };
}
