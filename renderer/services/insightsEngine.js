/**
 * Insights Engine
 * Consumes computed portfolio intelligence and emits signals
 */

export function computeInsights(portfolio) {
  const insights = [];

  // Concentration insight
  if (portfolio.concentration.top1 >= 60) {
    insights.push({
      type: "concentration",
      severity: "high",
      message: "Portfolio is heavily concentrated in a single position."
    });
  }

  // Exposure insight
  if (portfolio.exposure.crypto >= 60) {
    insights.push({
      type: "exposure",
      severity: "medium",
      message: "Crypto exposure is elevated relative to equities."
    });
  }

  // Performance insight
  if (portfolio.totalPnLPct >= 25) {
    insights.push({
      type: "performance",
      severity: "positive",
      message: "Portfolio has strong unrealized gains."
    });
  }

  // Confidence score (0–100)
  let confidenceScore = 50;

  if (portfolio.totalPnLPct > 0) confidenceScore += 10;
  if (portfolio.concentration.top1 < 40) confidenceScore += 10;
  if (portfolio.exposure.crypto > 70) confidenceScore -= 10;

  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // Bias
  let bias = "Neutral";
  if (confidenceScore >= 65) bias = "Risk-On";
  if (confidenceScore <= 35) bias = "Risk-Off";

  // Scenarios
  const scenarios = {
    bull: {
      portfolioChangePct: portfolio.totalPnLPct + 15
    },
    base: {
      portfolioChangePct: portfolio.totalPnLPct
    },
    bear: {
      portfolioChangePct: portfolio.totalPnLPct - 20
    }
  };

  return {
    insights,
    confidenceScore,
    bias,
    scenarios
  };
}

