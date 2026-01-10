/**
 * Insights Engine V1
 * ------------------
 * Canonical, deterministic portfolio interpretation engine.
 * Node-only. No IPC. No UI. No side effects.
 */

export function computeInsights(snapshot) {
  const portfolio = snapshot?.portfolio;
  const positions = Array.isArray(portfolio?.positions)
    ? portfolio.positions
    : [];

  const totalValue = positions.reduce(
    (sum, p) => sum + (typeof p.liveValue === "number" ? p.liveValue : 0),
    0
  );

  const totalHoldings = positions.length;

  const sortedByValue = positions
    .slice()
    .sort((a, b) => (b.liveValue || 0) - (a.liveValue || 0));

  const topHolding = sortedByValue[0] || null;
  const topWeight =
    topHolding && totalValue > 0
      ? (topHolding.liveValue / totalValue) * 100
      : 0;

  /* ===============================
     1. Risk posture
     =============================== */
  let riskPosture = "LOW";
  if (topWeight > 30 || totalHoldings < 6) {
    riskPosture = "HIGH";
  } else if (topWeight > 20 || totalHoldings < 10) {
    riskPosture = "MODERATE";
  }

  /* ===============================
     2. Diversification score
     =============================== */
  let diversificationScore = "WEAK";
  if (totalHoldings >= 12 && topWeight < 25) {
    diversificationScore = "STRONG";
  } else if (totalHoldings >= 8) {
    diversificationScore = "MODERATE";
  }

  /* ===============================
     3. Growth tilt
     =============================== */
  const growthSymbols = ["NVDA", "AVGO", "MSTR", "HOOD", "APLD"];

  const growthValue = positions
    .filter(p => growthSymbols.includes(p.symbol))
    .reduce((sum, p) => sum + (p.liveValue || 0), 0);

  const growthWeight =
    totalValue > 0 ? (growthValue / totalValue) * 100 : 0;

  let growthTilt = "BALANCED";
  if (growthWeight > 50) growthTilt = "GROWTH_HEAVY";
  else if (growthWeight < 25) growthTilt = "DEFENSIVE";

  /* ===============================
     4. Volatility proxy
     =============================== */
  const cryptoValue = positions
    .filter(p => p.assetClass === "crypto")
    .reduce((sum, p) => sum + (p.liveValue || 0), 0);

  const cryptoWeight =
    totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

  let volatilityProxy = "LOW";
  if (cryptoWeight > 20) volatilityProxy = "HIGH";
  else if (cryptoWeight > 10) volatilityProxy = "MODERATE";

  /* ===============================
     5. Confidence band
     =============================== */
  let confidenceBand = "HIGH";
  if (riskPosture === "HIGH" || volatilityProxy === "HIGH") {
    confidenceBand = "LOW";
  } else if (
    riskPosture === "MODERATE" ||
    volatilityProxy === "MODERATE"
  ) {
    confidenceBand = "MODERATE";
  }

  return {
    riskPosture,
    diversificationScore,
    growthTilt,
    volatilityProxy,
    confidenceBand,
    diagnostics: {
      totalValue,
      totalHoldings,
      topWeight,
      growthWeight,
      cryptoWeight
    }
  };
}
