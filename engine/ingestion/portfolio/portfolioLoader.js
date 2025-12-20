// engine/ingestion/portfolio/portfolioLoader.js
import { validatePortfolio } from './portfolioSchema.js';

let currentPortfolio = null;

export function loadPortfolio(portfolio) {
  validatePortfolio(portfolio);
  currentPortfolio = {
    ...portfolio,
    ts: Date.now()
  };
  return currentPortfolio;
}

export function getPortfolio() {
  return currentPortfolio;
}

