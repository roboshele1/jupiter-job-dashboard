// engine/signals/signalsEngine.js
// Signals Engine V2 — Confidence-aware + Context classification
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

function normalizeConfidence(v) {
  if (typeof v === "string") return v;
  if (v >= 0.8) return "High";
  if (v >= 0.5) return "Medium";
  return "Low";
}

/**
 * CONTEXT CLASSIFIER — APPEND-ONLY
 * Describes portfolio posture, not action.
 */
function classifyContext({ momentum, meanReversion, portfolioImpact, confidence }) {
  if (
    (meanReversion === "Oversold" || momentum === "Weak") &&
    portfolioImpact === "High" &&
    confidence !== "Low"
  ) {
    return "ACCUMULATION_ZONE";
  }

  if (
    (meanReversion === "Overextended" || momentum === "Strong") &&
    portfolioImpact === "Low" &&
    confidence === "Low"
  ) {
    return "DISTRIBUTION_ZONE";
  }

  return "NEUTRAL";
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

  const portfolioSignal = {
    symbol: "PORTFOLIO",
    assetClass: "aggregate",
    momentum: "-",
    meanReversion: "-",
    portfolioImpact: "Low",
    confidence: portfolioConfidence,
    confidenceRank: CONFIDENCE_ORDER[portfolioConfidence],
    delta: "→"
  };

  portfolioSignal.context = classifyContext({
    momentum: portfolioSignal.momentum,
    meanReversion: portfolioSignal.meanReversion,
    portfolioImpact: portfolioSignal.portfolioImpact,
    confidence: portfolioSignal.confidence
  });

  signals.push(portfolioSignal);

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

    const momentum = classifyMomentum(p.deltaPct ?? 0);
    const meanReversion = classifyMeanReversion(p.deltaPct ?? 0);
    const portfolioImpact = classifyImpact(p.deltaPct ?? 0);

    const signal = {
      symbol: p.symbol,
      assetClass: p.assetClass,
      momentum,
      meanReversion,
      portfolioImpact,
      confidence: nextConf,
      confidenceRank: CONFIDENCE_ORDER[nextConf],
      delta: "→"
    };

    signal.context = classifyContext({
      momentum,
      meanReversion,
      portfolioImpact,
      confidence: nextConf
    });

    signals.push(signal);
  }

  return {
    timestamp,
    signals,
    notifications: []
  };
}
