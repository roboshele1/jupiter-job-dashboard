// engine/valuation/testAllocation.js
import { ingestPrices } from '../market/priceIngestor.js';
import { valuePortfolio } from './portfolioValuationEngine.js';
import { computeAllocation } from './allocationEngine.js';

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

ingestPrices();
const valuation = valuePortfolio(portfolio);
console.log(computeAllocation(valuation.breakdown));

