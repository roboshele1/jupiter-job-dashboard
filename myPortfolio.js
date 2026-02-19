/**
 * YOUR ACTUAL PORTFOLIO DATA
 * Updated: February 13, 2026
 * 
 * This is the authoritative source for your current holdings
 */

export function getMyPortfolio() {
  return {
    asOf: '2026-02-13',
    currency: 'CAD',
    totalBookCost: 95161.45, // Sum of all book costs
    
    holdings: [
      // Tech Equities
      {
        symbol: 'NVDA',
        quantity: 73.4588,
        bookCost: 12967.25,
        assetClass: 'equity',
        sector: 'semiconductors'
      },
      {
        symbol: 'ASML',
        quantity: 10.079,
        bookCost: 8749.34,
        assetClass: 'equity',
        sector: 'semiconductors'
      },
      {
        symbol: 'AVGO',
        quantity: 80.2876,
        bookCost: 26285.66,
        assetClass: 'equity',
        sector: 'semiconductors'
      },
      {
        symbol: 'MSTR',
        quantity: 35.4873,
        bookCost: 8703.86,
        assetClass: 'equity',
        sector: 'bitcoin-proxy'
      },
      {
        symbol: 'HOOD',
        quantity: 35,
        bookCost: 3316.68,
        assetClass: 'equity',
        sector: 'fintech'
      },
      {
        symbol: 'BMNR',
        quantity: 175,
        bookCost: 6312.34,
        assetClass: 'equity',
        sector: 'bitcoin-mining'
      },
      {
        symbol: 'APLD',
        quantity: 87.8812,
        bookCost: 1765.13,
        assetClass: 'equity',
        sector: 'bitcoin-mining'
      },
      {
        symbol: 'NOW',
        quantity: 20,
        bookCost: 2088.98,
        assetClass: 'equity',
        sector: 'enterprise-software'
      },
      
      // Crypto
      {
        symbol: 'BTC',
        quantity: 0.281212,
        bookCost: 24764.31,
        assetClass: 'crypto',
        sector: 'crypto'
      },
      {
        symbol: 'ETH',
        quantity: 0.25,
        bookCost: 597.90,
        assetClass: 'crypto',
        sector: 'crypto'
      }
    ],
    
    // Portfolio characteristics
    characteristics: {
      cryptoExposure: 25362.21, // BTC + ETH book cost
      cryptoExposurePct: 26.7,  // % of total portfolio
      
      semiconductorExposure: 48002.25, // NVDA + ASML + AVGO
      semiconductorExposurePct: 50.5,
      
      bitcoinProxyExposure: 40785.64, // MSTR + BMNR + APLD + BTC
      bitcoinProxyExposurePct: 42.9,
      
      topHolding: 'AVGO',
      topHoldingPct: 27.6,
      
      concentrationRisk: 'HIGH', // Top 3 holdings = 71% of portfolio
      
      totalPositions: 10
    }
  };
}

// Helper to get current market values (you'll need to update prices)
export function getCurrentPrices() {
  return {
    // Update these with current prices when running
    NVDA: 145.50,   // Example - replace with real price
    ASML: 867.00,
    AVGO: 178.00,
    MSTR: 245.00,
    HOOD: 47.00,
    BMNR: 36.00,
    APLD: 20.00,
    NOW: 104.00,
    BTC: 88000.00,  // Per BTC
    ETH: 2390.00    // Per ETH
  };
}

// Calculate current market value
export function getPortfolioValue() {
  const portfolio = getMyPortfolio();
  const prices = getCurrentPrices();
  
  let totalMarketValue = 0;
  const positions = [];
  
  for (const holding of portfolio.holdings) {
    const price = prices[holding.symbol] || 0;
    const marketValue = holding.quantity * price;
    const unrealizedPL = marketValue - holding.bookCost;
    const returnPct = (unrealizedPL / holding.bookCost) * 100;
    
    positions.push({
      symbol: holding.symbol,
      quantity: holding.quantity,
      bookCost: holding.bookCost,
      currentPrice: price,
      marketValue,
      unrealizedPL,
      returnPct: Number(returnPct.toFixed(2)),
      positionPct: 0 // Will calculate after total
    });
    
    totalMarketValue += marketValue;
  }
  
  // Calculate position percentages
  for (const pos of positions) {
    pos.positionPct = Number(((pos.marketValue / totalMarketValue) * 100).toFixed(2));
  }
  
  const totalUnrealized = totalMarketValue - portfolio.totalBookCost;
  const totalReturnPct = (totalUnrealized / portfolio.totalBookCost) * 100;
  
  return {
    asOf: new Date().toISOString(),
    totalBookCost: portfolio.totalBookCost,
    totalMarketValue: Number(totalMarketValue.toFixed(2)),
    totalUnrealizedPL: Number(totalUnrealized.toFixed(2)),
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    positions,
    
    // Goal tracking
    goal: {
      target: 1000000,
      current: totalMarketValue,
      remaining: 1000000 - totalMarketValue,
      progressPct: Number((totalMarketValue / 1000000 * 100).toFixed(2)),
      monthsRemaining: 60, // To 2030
      requiredCAGR: 47.0 // Approximate
    }
  };
}
