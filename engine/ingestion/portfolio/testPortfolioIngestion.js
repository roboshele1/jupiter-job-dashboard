// engine/ingestion/portfolio/testPortfolioIngestion.js
import { loadPortfolio, getPortfolio } from './portfolioLoader.js';
import { samplePortfolio } from './samplePortfolio.js';

loadPortfolio(samplePortfolio);
console.log(getPortfolio());

