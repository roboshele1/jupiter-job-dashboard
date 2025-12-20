const { getPrices } = require("./priceService");

function pricePortfolio(holdings) {
  const prices = getPrices();
  let totalValue = 0;

  const positions = holdings.map(h => {
    const price = prices[h.symbol] || 0;
    const value = price * h.qty;
    totalValue += value;

    return {
      symbol: h.symbol,
      qty: h.qty,
      price,
      value
    };
  });

  return { totalValue, positions };
}

module.exports = {
  pricePortfolio
};

