/**
 * Insights V2 — Interpretation Engine (Node-only)
 * -----------------------------------------------
 * Purpose:
 * - Produce qualitative interpretations of portfolio structure
 * - NO prices fetched here (uses valuation output only)
 * - NO charts, NO actions, NO IPC, NO Electron
 * - Pure deterministic function over portfolio valuation snapshot
 */

export function interpretPortfolio(valuation) {
  if (!valuation || !Array.isArray(valuation.positions)) {
    return {
      status: "INVALID_SNAPSHOT",
      interpretations: []
    };
  }

  const positions = valuation.positions;
  const totalValue = valuation.totals?.liveValue || 0;

  if (totalValue <= 0 || positions.length === 0) {
    return {
      status: "INVALID_SNAPSHOT",
      interpretations: []
    };
  }

  const interpretations = [];

  /* =========================
     CONCENTRATION
     ========================= */
  const sortedByValue = [...positions].sort(
    (a, b) => b.liveValue - a.liveValue
  );

  const topHolding = sortedByValue[0];
  const topWeight = topHolding.liveValue / totalValue;

  if (topWeight > 0.25) {
    interpretations.push({
      type: "CONCENTRATION",
      severity: "ELEVATED",
      message: `Portfolio shows elevated concentration in ${topHolding.symbol} (${(topWeight * 100).toFixed(1)}%).`
    });
  } else {
    interpretations.push({
      type: "CONCENTRATION",
      severity: "NORMAL",
      message: "Portfolio concentration is within normal bounds."
    });
  }

  /* =========================
     ASSET MIX
     ========================= */
  const equityCount = positions.filter(p => p.assetClass === "equity").length;
  const cryptoCount = positions.filter(p => p.assetClass === "crypto").length;

  interpretations.push({
    type: "ASSET_MIX",
    severity: "INFO",
    message: `Holdings span ${equityCount} equities and ${cryptoCount} crypto assets.`
  });

  /* =========================
     VOLATILITY EXPOSURE
     ========================= */
  const cryptoValue = positions
    .filter(p => p.assetClass === "crypto")
    .reduce((sum, p) => sum + p.liveValue, 0);

  const cryptoWeight = cryptoValue / totalValue;

  if (cryptoWeight > 0.20) {
    interpretations.push({
      type: "VOLATILITY_EXPOSURE",
      severity: "ELEVATED",
      message: "Portfolio has elevated exposure to higher-volatility crypto assets."
    });
  } else if (cryptoWeight > 0.10) {
    interpretations.push({
      type: "VOLATILITY_EXPOSURE",
      severity: "MODERATE",
      message: "Portfolio has moderate exposure to higher-volatility assets."
    });
  } else {
    interpretations.push({
      type: "VOLATILITY_EXPOSURE",
      severity: "LOW",
      message: "Portfolio volatility exposure appears controlled."
    });
  }

  /* =========================
     DIVERSIFICATION
     ========================= */
  if (positions.length >= 8 && topWeight < 0.30) {
    interpretations.push({
      type: "DIVERSIFICATION",
      severity: "ADEQUATE",
      message: "Portfolio shows reasonable diversification across holdings."
    });
  } else {
    interpretations.push({
      type: "DIVERSIFICATION",
      severity: "LIMITED",
      message: "Portfolio diversification may be constrained."
    });
  }

  /* =========================
     RISK LENS
     ========================= */
  let riskSeverity = "LOW";
  if (cryptoWeight > 0.20 || topWeight > 0.30) {
    riskSeverity = "ELEVATED";
  } else if (cryptoWeight > 0.10 || topWeight > 0.20) {
    riskSeverity = "MODERATE";
  }

  interpretations.push({
    type: "RISK_LENS",
    severity: riskSeverity,
    message:
      riskSeverity === "ELEVATED"
        ? "Overall portfolio risk profile is elevated due to concentration and volatility exposure."
        : riskSeverity === "MODERATE"
        ? "Overall portfolio risk profile is moderate."
        : "Overall portfolio risk profile appears controlled."
  });

  /* =========================
     GROWTH TILT
     ========================= */
  const growthSymbols = ["NVDA", "AVGO", "MSTR", "HOOD", "APLD"];
  const growthValue = positions
    .filter(p => growthSymbols.includes(p.symbol))
    .reduce((sum, p) => sum + p.liveValue, 0);

  const growthWeight = growthValue / totalValue;

  let growthTilt = "BALANCED";
  if (growthWeight > 0.50) growthTilt = "GROWTH_HEAVY";
  else if (growthWeight < 0.25) growthTilt = "DEFENSIVE";

  interpretations.push({
    type: "GROWTH_TILT",
    severity: "INFO",
    message:
      growthTilt === "GROWTH_HEAVY"
        ? "Portfolio is heavily tilted toward growth-oriented assets."
        : growthTilt === "DEFENSIVE"
        ? "Portfolio leans toward a more defensive posture."
        : "Portfolio maintains a balanced growth profile."
  });

  /* =========================
     DRAWDOWN PROXY
     ========================= */
  let drawdownRisk = "RESILIENT";
  if (riskSeverity === "ELEVATED" && growthTilt === "GROWTH_HEAVY") {
    drawdownRisk = "FRAGILE";
  } else if (riskSeverity === "MODERATE") {
    drawdownRisk = "MODERATE_RISK";
  }

  interpretations.push({
    type: "DRAWDOWN_PROXY",
    severity: drawdownRisk,
    message:
      drawdownRisk === "FRAGILE"
        ? "Portfolio may be vulnerable to drawdowns during adverse market conditions."
        : drawdownRisk === "MODERATE_RISK"
        ? "Portfolio shows moderate sensitivity to market drawdowns."
        : "Portfolio structure suggests resilience against drawdowns."
  });

  /* =========================
     LIQUIDITY TILT (NEW)
     ========================= */
  let liquidityTilt = "HIGH";
  if (cryptoWeight > 0.20 || growthWeight > 0.50) {
    liquidityTilt = "LOW";
  } else if (cryptoWeight > 0.10 || growthWeight > 0.35) {
    liquidityTilt = "MODERATE";
  }

  interpretations.push({
    type: "LIQUIDITY_TILT",
    severity: liquidityTilt,
    message:
      liquidityTilt === "LOW"
        ? "Portfolio liquidity may tighten under market stress due to asset mix."
        : liquidityTilt === "MODERATE"
        ? "Portfolio liquidity is moderate under normal conditions."
        : "Portfolio liquidity profile appears strong."
  });

  /* =========================
     SINGLE-NAME RISK (NEW)
     ========================= */
  interpretations.push({
    type: "SINGLE_NAME_RISK",
    severity: topWeight > 0.30 ? "ELEVATED" : "MANAGEABLE",
    message:
      topWeight > 0.30
        ? `Single-name exposure to ${topHolding.symbol} represents a meaningful risk concentration.`
        : "Single-name exposure is within manageable bounds."
  });

  return {
    status: "OK",
    generatedAt: Date.now(),
    interpretations
  };
}
