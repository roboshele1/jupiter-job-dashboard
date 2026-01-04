// engine/risk/riskEngineV1.js
export function runRiskEngineV1({ decisionOutput, portfolio }) {
  // Base engine object
  const riskEngine = {
    engine: 'RISK_ENGINE_V1',
    alerts: [],
    portfolioSummary: {
      totalValue: portfolio.positions?.reduce((sum, pos) => sum + (pos.value || 0), 0) || 0,
      cryptoExposure: 0,
      equityExposure: 0,
      largestPosition: null,
      positionsCount: portfolio.positions?.length || 0,
    },
  };

  // Calculate exposures
  if (portfolio.positions && portfolio.positions.length > 0) {
    let maxPos = portfolio.positions[0];
    let totalEquity = 0;
    let totalCrypto = 0;

    for (const pos of portfolio.positions) {
      if (pos.assetClass === 'Crypto') totalCrypto += pos.value || 0;
      else totalEquity += pos.value || 0;
      if (!maxPos || (pos.value || 0) > (maxPos.value || 0)) maxPos = pos;
    }

    riskEngine.portfolioSummary.cryptoExposure = totalCrypto;
    riskEngine.portfolioSummary.equityExposure = totalEquity;
    riskEngine.portfolioSummary.largestPosition = maxPos?.symbol || null;
  }

  // Attach alerts from decision engine
  if (decisionOutput && Array.isArray(decisionOutput.alerts)) {
    riskEngine.alerts = decisionOutput.alerts;
  }

  // Return the engine object
  return riskEngine;
}

