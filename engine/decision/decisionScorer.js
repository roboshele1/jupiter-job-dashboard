// engine/decision/decisionScorer.js
// Decision Scoring Engine V2
// Deterministic, side-effect free, read-only

export function scoreDecisions(input) {
  const {
    asOf,
    portfolio,
    signals,
    risk
  } = input;

  if (!portfolio || !signals || !risk) {
    throw new Error("Invalid DecisionInputContractV2");
  }

  const results = [];

  for (const symbol of Object.keys(portfolio.positions)) {
    const position = portfolio.positions[symbol];
    const signal = signals[symbol] || {};
    const riskProfile = risk[symbol] || {};

    let score = 0;
    const explanation = [];

    // SIGNAL STRENGTH (0–40)
    if (signal.bias === "BULLISH") {
      score += 30;
      explanation.push("Bullish signal");
    }
    if (signal.momentum === "STRONG") {
      score += 10;
      explanation.push("Strong momentum");
    }

    // RISK ADJUSTMENT (-30 to +10)
    if (riskProfile.level === "HIGH") {
      score -= 30;
      explanation.push("High risk exposure");
    }
    if (riskProfile.level === "MODERATE") {
      score -= 10;
      explanation.push("Moderate risk exposure");
    }
    if (riskProfile.level === "LOW") {
      score += 10;
      explanation.push("Low risk exposure");
    }

    // CONCENTRATION PENALTY (-20 max)
    if (position.weightPct > 25) {
      score -= 20;
      explanation.push("Over-concentrated position");
    }

    // FINAL ACTION DETERMINATION
    let action = "HOLD";
    if (score >= 40) action = "BUY";
    if (score <= -20) action = "REDUCE";

    results.push({
      symbol,
      action,
      score,
      confidence: Math.min(Math.abs(score) / 100, 1),
      explanation
    });
  }

  return {
    engine: "DECISION_ENGINE_V2_SCORER",
    asOf,
    decisions: results.sort((a, b) => b.score - a.score)
  };
}

