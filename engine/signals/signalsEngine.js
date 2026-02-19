// engine/signals/signalsEngine.js
// Signals Engine V5 — Regime-Aware Dynamic Thresholds
// Thresholds tighten in RISK_OFF, loosen in RISK_ON
// Export: buildSignalsSnapshot (unchanged contract for IPC)

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

function getMomentumThreshold(regimeSignal) {
  switch (regimeSignal) {
    case "RISK_ON":       return 0.015;
    case "MILD_RISK_ON":  return 0.025;
    case "RISK_OFF":      return 0.05;
    case "MILD_RISK_OFF": return 0.04;
    default:              return 0.03;
  }
}

function classifyImpact(pct = 0) {
  if (pct <= -0.05) return "High";
  if (pct <= -0.02) return "Moderate";
  return "Low";
}

function classifyMomentum(deltaPct = 0, threshold = 0.03) {
  if (deltaPct > threshold)  return "Strong";
  if (deltaPct < -threshold) return "Weak";
  return "Neutral";
}

function classifyMeanReversion(deltaPct = 0) {
  if (deltaPct > 0.05)  return "Overextended";
  if (deltaPct < -0.05) return "Oversold";
  return "Neutral";
}

function classifyContext(deltaPct = 0) {
  if (deltaPct <= -0.05) return "ACCUMULATION_ZONE";
  if (deltaPct >= 0.05)  return "DISTRIBUTION_ZONE";
  return "NEUTRAL";
}

function computeDelta(deltaPct = 0) {
  if (deltaPct > 0) return "↑";
  if (deltaPct < 0) return "↓";
  return "→";
}

function normalizeStrength(deltaPct = 0) {
  const abs = Math.abs(deltaPct);
  if (abs >= 0.10) return 1;
  if (abs >= 0.05) return 0.75;
  if (abs >= 0.02) return 0.5;
  if (abs > 0)     return 0.25;
  return 0;
}

function normalizeConfidence(confidence = "Low") {
  if (confidence === "High")   return 1;
  if (confidence === "Medium") return 0.6;
  return 0.3;
}

function normalizeMateriality(deltaPct = 0) {
  const abs = Math.abs(deltaPct);
  if (abs >= 0.10) return 1;
  if (abs >= 0.05) return 0.7;
  if (abs >= 0.02) return 0.4;
  return 0.1;
}

function buildTechnicals(deltaPct = 0, regimeSignal = "NEUTRAL") {
  const threshold = getMomentumThreshold(regimeSignal);
  return {
    momentum:      classifyMomentum(deltaPct, threshold),
    meanReversion: classifyMeanReversion(deltaPct),
    context:       classifyContext(deltaPct),
    regimeSignal,
    threshold,
  };
}

// Named export matches IPC contract exactly
export function buildSignalsSnapshot({
  portfolio,
  confidenceEvaluations = [],
  regimeSignal = "NEUTRAL",
}) {
  const timestamp = Date.now();
  const signals   = [];

  const portfolioConfidence =
    confidenceEvaluations.find(c => c.symbol === "PORTFOLIO")
      ?.confidenceTransition?.nextConfidence || "Low";

  signals.push({
    symbol:          "PORTFOLIO",
    assetClass:      "aggregate",
    momentum:        "-",
    meanReversion:   "-",
    portfolioImpact: "Low",
    confidence:      portfolioConfidence,
    confidenceRank:  CONFIDENCE_ORDER[portfolioConfidence],
    delta:           "→",
    context:         "NEUTRAL",
    strength:        0,
    materiality:     0,
    technicals:      null,
    regimeSignal,
  });

  const positions = Array.isArray(portfolio?.positions) ? portfolio.positions : [];

  for (const p of positions) {
    const evalResult      = confidenceEvaluations.find(e => e.symbol === p.symbol);
    const nextConf        = evalResult?.confidenceTransition?.nextConfidence || "Low";
    const deltaPct        = p.deltaPct ?? 0;
    const technicals      = buildTechnicals(deltaPct, regimeSignal);
    const strength        = normalizeStrength(deltaPct);
    const confidenceScore = normalizeConfidence(nextConf);
    const materiality     = normalizeMateriality(deltaPct);

    signals.push({
      symbol:           p.symbol,
      assetClass:       p.assetClass,
      momentum:         technicals.momentum,
      meanReversion:    technicals.meanReversion,
      portfolioImpact:  classifyImpact(deltaPct),
      confidence:       nextConf,
      confidenceRank:   CONFIDENCE_ORDER[nextConf],
      delta:            computeDelta(deltaPct),
      context:          classifyContext(deltaPct),
      technicals,
      strength,
      signalConfidence: confidenceScore,
      materiality,
      regimeSignal,
    });
  }

  return { timestamp, signals, notifications: [], regimeSignal };
}
