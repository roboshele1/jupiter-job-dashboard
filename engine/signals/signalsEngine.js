// engine/signals/signalsEngine.js
// Deterministic, defensive Signals Engine
// NEVER throws on missing inputs

// ----------------- HELPERS -----------------

function classifyImpact(pct = 0) {
  if (pct <= -0.05) return "High";
  if (pct <= -0.02) return "Moderate";
  return "Low";
}

function classifyConfidence(v = 0) {
  if (v >= 0.8) return "High";
  if (v >= 0.5) return "Medium";
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

function buildNotifications(insights = {}) {
  const notes = [];
  const conf = insights?.confidence?.confidence ?? 0;

  if (conf >= 0.8) {
    notes.push({ type: "HIGH_CONFIDENCE_SIGNAL", severity: "info" });
  }

  return notes;
}

// ----------------- MAIN ENGINE -----------------

export function buildSignalsSnapshot({ insights = {}, portfolio = {} }) {
  const timestamp = Date.now();

  const deltas = insights?.deltas ?? {};
  const confidenceVal = insights?.confidence?.confidence ?? 0;

  const signals = [];

  // ---- PORTFOLIO AGGREGATE (ALWAYS PRESENT) ----
  signals.push({
    symbol: "PORTFOLIO",
    assetClass: "aggregate",
    momentum: "-",
    meanReversion: "-",
    portfolioImpact: classifyImpact(deltas.deltaPortfolioImpactPct ?? 0),
    confidence: classifyConfidence(confidenceVal),
    delta: "→"
  });

  // ---- PER-ASSET SIGNALS (SAFE) ----
  const positions = Array.isArray(portfolio.positions)
    ? portfolio.positions
    : [];

  for (const p of positions) {
    const deltaPct = p.deltaPct ?? 0;

    signals.push({
      symbol: p.symbol,
      assetClass: p.assetClass,
      momentum: classifyMomentum(deltaPct),
      meanReversion: classifyMeanReversion(deltaPct),
      portfolioImpact: classifyImpact(deltaPct),
      confidence: classifyConfidence(confidenceVal),
      delta: deltaPct > 0 ? "↑" : deltaPct < 0 ? "↓" : "→"
    });
  }

  return {
    timestamp,
    signals,
    notifications: buildNotifications(insights)
  };
}

