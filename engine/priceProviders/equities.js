// engine/priceProviders/equities.js
// Deterministic equity price provider (v1 stub – no hallucination)

async function getEquityPrices(symbols = []) {
  const prices = {};

  for (const s of symbols) {
    // v1 rule: if no live provider wired, explicitly return null
    prices[s] = null;
  }

  return prices;
}

module.exports = {
  getEquityPrices
};

