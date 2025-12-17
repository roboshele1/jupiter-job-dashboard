/**
 * Coinbase price provider (crypto only)
 * Public endpoint, no auth required.
 * Safe, non-streaming.
 */

const axios = require("axios");

async function getCryptoPrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    try {
      const pair = `${symbol}-USD`;
      const url = `https://api.coinbase.com/v2/prices/${pair}/spot`;
      const res = await axios.get(url);

      if (res.data && res.data.data && res.data.data.amount) {
        const price = parseFloat(res.data.data.amount);
        prices[symbol] = {
          price,
          prevClose: price // Coinbase spot has no prior close; use price
        };
      } else {
        prices[symbol] = { price: 0, prevClose: 0 };
      }
    } catch (err) {
      prices[symbol] = { price: 0, prevClose: 0 };
    }
  }

  return prices;
}

module.exports = {
  getCryptoPrices
};

