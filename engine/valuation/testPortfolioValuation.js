// engine/valuation/testPortfolioValuation.js
import { ingestPrices } from '../market/priceIngestor.js';
import { valuePortfolio } from './portfolioValuationEngine.js';

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
console.log(valuePortfolio(portfolio));

