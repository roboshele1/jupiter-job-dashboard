// engine/pl/testDailyPnL.js
import { ingestPrices } from '../market/priceIngestor.js';
import { valuePortfolio } from '../valuation/portfolioValuationEngine.js';
import { applyCostBasis } from './costBasisEngine.js';
import { computeDailyPnL } from './dailyPnLEngine.js';

const portfolio = {
  owner: 'Edwin',
  currency: 'USD',
  assets: [
    { symbol: 'NVDA', quantity: 73, type: 'Equity' },
    { symbol: 'AVGO', quantity: 80, type: 'Equity' },
    { symbol: 'ASML', quantity: 10, type: 'Equity' },
    { symbol: 'BTC', quantity: 0.251083, type: 'Digital' },
    { symbol: 'ETH', quantity: 0.25, type: 'Digital' }
  ]
};

// example cost basis (replace later with real history)
const costBasis = {
  NVDA: 820,
  AVGO: 175,
  ASML: 830,
  BTC: 64000,
  ETH: 3200
};

ingestPrices();
const valuation = valuePortfolio(portfolio);
const withCost = applyCostBasis(valuation, costBasis);
console.log(withCost.breakdown);
console.log(computeDailyPnL(withCost.breakdown));

