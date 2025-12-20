// engine/decision/paths/testPortfolioPath.js
import { projectPortfolio } from './portfolioPath.js';

const result = projectPortfolio({
  months: 36,
  assets: [
    { symbol: 'NVDA', capital: 200000, annualCAGR: 30 },
    { symbol: 'AVGO', capital: 150000, annualCAGR: 22 },
    { symbol: 'BTC', capital: 100000, annualCAGR: 35 }
  ]
});

console.log(JSON.stringify(result, null, 2));

