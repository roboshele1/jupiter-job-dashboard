// engine/valuation/portfolioValuationEngine.js
import { getPrice } from '../market/priceEngine.js';

export function valuePortfolio(portfolio) {
  let totalValue = 0;
  const breakdown = portfolio.assets.map(asset => {
    const price = getPrice(asset.symbol) ?? 0;
    const value = price * asset.quantity;
    totalValue += value;

    return {
      symbol: asset.symbol,
      quantity: asset.quantity,
      price,
      value,
      type: asset.type
    };
  });

  return {
    owner: portfolio.owner,
    currency: portfolio.currency,
    totalValue,
    breakdown,
    ts: Date.now()
  };
}

