/**
 * Portfolio Types Manager
 * Supports multiple portfolio strategies with isolated constraints
 */

const portfolioTypes = {
  CORE_GROWTH: {
    id: 'core-growth',
    name: 'Core Growth',
    description: 'Long-term capital appreciation (5+ years)',
    constraints: {
      maxPositionSize: 0.15,      // 15% per position
      maxSectorExposure: 0.35,    // 35% per sector
      minDiversification: 8,       // min 8 holdings
      maxLeverage: 1.0,            // no margin
      minLiquidity: 1000000,       // $1M daily volume min
    },
    riskTier: 'moderate',
    rebalanceFrequency: 'quarterly',
  },

  HIGH_CONVICTION: {
    id: 'high-conviction',
    name: 'High Conviction',
    description: 'Concentrated bets on thesis-driven ideas (1-3 years)',
    constraints: {
      maxPositionSize: 0.25,       // 25% per position
      maxSectorExposure: 0.50,     // 50% per sector
      minDiversification: 3,       // min 3 holdings
      maxLeverage: 1.5,            // 50% margin allowed
      minLiquidity: 500000,        // $500K daily volume min
    },
    riskTier: 'aggressive',
    rebalanceFrequency: 'monthly',
  },

  HEDGE: {
    id: 'hedge',
    name: 'Hedge Portfolio',
    description: 'Downside protection (inverse/defensive)',
    constraints: {
      maxPositionSize: 0.20,
      maxSectorExposure: 0.40,
      minDiversification: 5,
      maxLeverage: 2.0,            // short allowed
      minLiquidity: 2000000,
    },
    riskTier: 'defensive',
    rebalanceFrequency: 'weekly',
  },

  INCOME: {
    id: 'income',
    name: 'Income Portfolio',
    description: 'Dividend/yield focused',
    constraints: {
      maxPositionSize: 0.20,
      maxSectorExposure: 0.45,
      minDiversification: 6,
      maxLeverage: 1.0,
      minLiquidity: 1000000,
      minDividendYield: 0.02,      // 2% min yield
    },
    riskTier: 'conservative',
    rebalanceFrequency: 'quarterly',
  },
};

/**
 * Validate holding against portfolio constraints
 */
function validateHoldingAgainstConstraints(
  holding,
  portfolio,
  allHoldings,
  marketData
) {
  const constraints = portfolioTypes[portfolio].constraints;
  const violations = [];

  // Position size check
  const totalValue = allHoldings.reduce((sum, h) => sum + (h.qty * h.price), 0);
  const holdingValue = holding.qty * holding.price;
  const positionPct = holdingValue / totalValue;

  if (positionPct > constraints.maxPositionSize) {
    violations.push({
      type: 'POSITION_SIZE',
      current: positionPct,
      max: constraints.maxPositionSize,
      message: `Position ${(positionPct * 100).toFixed(1)}% exceeds max ${(constraints.maxPositionSize * 100).toFixed(1)}%`,
    });
  }

  // Liquidity check
  if (marketData[holding.symbol]?.avgVolume < constraints.minLiquidity) {
    violations.push({
      type: 'LIQUIDITY',
      current: marketData[holding.symbol]?.avgVolume || 0,
      min: constraints.minLiquidity,
      message: `Daily volume below $${(constraints.minLiquidity / 1000000).toFixed(1)}M minimum`,
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Calculate sector exposure for portfolio
 */
function calculateSectorExposure(holdings, sectorMap) {
  const sectorValues = {};
  const totalValue = holdings.reduce((sum, h) => sum + (h.qty * h.price), 0);

  holdings.forEach((h) => {
    const sector = sectorMap[h.symbol] || 'Other';
    if (!sectorValues[sector]) sectorValues[sector] = 0;
    sectorValues[sector] += h.qty * h.price;
  });

  const sectorExposure = {};
  Object.keys(sectorValues).forEach((sector) => {
    sectorExposure[sector] = {
      value: sectorValues[sector],
      pct: sectorValues[sector] / totalValue,
    };
  });

  return sectorExposure;
}

module.exports = {
  portfolioTypes,
  validateHoldingAgainstConstraints,
  calculateSectorExposure,
};
