// engine/ingestion/portfolio/portfolioSchema.js

export function validatePortfolio(portfolio) {
  if (!Array.isArray(portfolio.assets)) {
    throw new Error('Portfolio must contain assets array');
  }

  portfolio.assets.forEach(a => {
    if (!a.symbol || typeof a.quantity !== 'number') {
      throw new Error('Invalid asset entry');
    }
  });

  return true;
}


