/**
 * Constraint Engine
 * Validates portfolio constraints and provides compliance reports
 */

/**
 * Sector mapping (common tickers)
 */
const SECTOR_MAP = {
  NVDA: 'Technology',
  ASML: 'Technology',
  AVGO: 'Technology',
  NOW: 'Software',
  CELH: 'Consumer',
  AXON: 'Technology',
  ZETA: 'Technology',
  MSTR: 'Software',
  BTC: 'Crypto',
  ETH: 'Crypto',
};

/**
 * Full constraint validation against portfolio type
 */
function validatePortfolioConstraints(holdings, portfolioType, marketData) {
  const constraints = portfolioType.constraints;
  const violations = [];
  const warnings = [];

  // 1. Position size violations
  const totalValue = holdings.reduce((sum, h) => sum + (h.qty * h.price), 0);
  holdings.forEach((h) => {
    const holdingValue = h.qty * h.price;
    const positionPct = holdingValue / totalValue;

    if (positionPct > constraints.maxPositionSize) {
      violations.push({
        type: 'POSITION_SIZE_EXCEEDED',
        symbol: h.symbol,
        current: positionPct,
        max: constraints.maxPositionSize,
        message: `${h.symbol}: ${(positionPct * 100).toFixed(1)}% exceeds ${(constraints.maxPositionSize * 100).toFixed(1)}%`,
      });
    }

    // Warn if approaching limit
    if (positionPct > constraints.maxPositionSize * 0.85) {
      warnings.push({
        type: 'POSITION_SIZE_WARNING',
        symbol: h.symbol,
        current: positionPct,
        max: constraints.maxPositionSize,
      });
    }
  });

  // 2. Sector exposure violations
  const sectorValues = {};
  holdings.forEach((h) => {
    const sector = SECTOR_MAP[h.symbol] || 'Other';
    if (!sectorValues[sector]) sectorValues[sector] = 0;
    sectorValues[sector] += h.qty * h.price;
  });

  Object.keys(sectorValues).forEach((sector) => {
    const sectorPct = sectorValues[sector] / totalValue;
    if (sectorPct > constraints.maxSectorExposure) {
      violations.push({
        type: 'SECTOR_EXPOSURE_EXCEEDED',
        sector,
        current: sectorPct,
        max: constraints.maxSectorExposure,
        message: `${sector}: ${(sectorPct * 100).toFixed(1)}% exceeds ${(constraints.maxSectorExposure * 100).toFixed(1)}%`,
      });
    }
  });

  // 3. Diversification check
  if (holdings.length < constraints.minDiversification) {
    warnings.push({
      type: 'DIVERSIFICATION_LOW',
      current: holdings.length,
      min: constraints.minDiversification,
      message: `Only ${holdings.length} holdings, minimum ${constraints.minDiversification} recommended`,
    });
  }

  // 4. Liquidity check
  holdings.forEach((h) => {
    const volume = marketData[h.symbol]?.avgVolume || 0;
    if (volume < constraints.minLiquidity) {
      violations.push({
        type: 'LIQUIDITY_INSUFFICIENT',
        symbol: h.symbol,
        current: volume,
        min: constraints.minLiquidity,
        message: `${h.symbol}: $${(volume / 1000000).toFixed(1)}M daily volume below $${(constraints.minLiquidity / 1000000).toFixed(1)}M min`,
      });
    }
  });

  // 5. Dividend yield check (if applicable)
  if (constraints.minDividendYield) {
    holdings.forEach((h) => {
      const yield_ = marketData[h.symbol]?.dividendYield || 0;
      if (yield_ < constraints.minDividendYield && !['BTC', 'ETH'].includes(h.symbol)) {
        warnings.push({
          type: 'DIVIDEND_YIELD_LOW',
          symbol: h.symbol,
          current: yield_,
          min: constraints.minDividendYield,
        });
      }
    });
  }

  return {
    compliant: violations.length === 0,
    violations,
    warnings,
    summary: {
      totalHoldings: holdings.length,
      totalValue,
      maxPositionSize: Math.max(...holdings.map((h) => (h.qty * h.price) / totalValue)),
      sectors: Object.keys(sectorValues).length,
      sectorExposure: sectorValues,
    },
  };
}

/**
 * Generate rebalance recommendations to fix violations
 */
function generateRebalanceRecommendations(holdings, portfolioType, marketData) {
  const validation = validatePortfolioConstraints(holdings, portfolioType, marketData);
  const recommendations = [];
  const totalValue = holdings.reduce((sum, h) => sum + (h.qty * h.price), 0);

  validation.violations.forEach((v) => {
    if (v.type === 'POSITION_SIZE_EXCEEDED') {
      const holding = holdings.find((h) => h.symbol === v.symbol);
      const targetPct = portfolioType.constraints.maxPositionSize * 0.95;
      const targetValue = totalValue * targetPct;
      const qtyToSell = Math.floor((holding.qty * holding.price - targetValue) / holding.price);

      recommendations.push({
        action: 'SELL',
        symbol: v.symbol,
        qty: qtyToSell,
        reason: `Reduce position from ${(v.current * 100).toFixed(1)}% to ${(targetPct * 100).toFixed(1)}%`,
      });
    }

    if (v.type === 'SECTOR_EXPOSURE_EXCEEDED') {
      recommendations.push({
        action: 'REBALANCE_SECTOR',
        sector: v.sector,
        reason: `Reduce ${v.sector} from ${(v.current * 100).toFixed(1)}% to ${(v.max * 100).toFixed(1)}%`,
      });
    }

    if (v.type === 'LIQUIDITY_INSUFFICIENT') {
      recommendations.push({
        action: 'REDUCE_OR_ELIMINATE',
        symbol: v.symbol,
        reason: `Insufficient daily liquidity ($${(v.current / 1000000).toFixed(1)}M < $${(v.min / 1000000).toFixed(1)}M)`,
      });
    }
  });

  return recommendations;
}

/**
 * Calculate portfolio stress under constraint violations
 */
function calculateConstraintStress(holdings, portfolioType) {
  const constraints = portfolioType.constraints;
  const totalValue = holdings.reduce((sum, h) => sum + (h.qty * h.price), 0);

  let stressScore = 0; // 0-100
  let stressFactors = [];

  // Position concentration stress
  const maxPosition = Math.max(...holdings.map((h) => (h.qty * h.price) / totalValue));
  if (maxPosition > constraints.maxPositionSize) {
    const excess = maxPosition - constraints.maxPositionSize;
    stressScore += excess * 100;
    stressFactors.push(`Concentration: ${(excess * 100).toFixed(1)}% over limit`);
  }

  // Low diversification stress
  if (holdings.length < constraints.minDiversification) {
    const deficit = constraints.minDiversification - holdings.length;
    stressScore += deficit * 5;
    stressFactors.push(`Diversification: ${deficit} holdings short of ${constraints.minDiversification}`);
  }

  return {
    stressScore: Math.min(stressScore, 100),
    stressFactors,
    severity: stressScore > 50 ? 'HIGH' : stressScore > 20 ? 'MEDIUM' : 'LOW',
  };
}

module.exports = {
  validatePortfolioConstraints,
  generateRebalanceRecommendations,
  calculateConstraintStress,
  SECTOR_MAP,
};
