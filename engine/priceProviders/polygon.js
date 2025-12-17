/**
 * Polygon price provider (equities only)
 * Safe, delayed-compatible, non-streaming.
 */

const axios = require("axios");

const POLYGON_API_KEY =
  process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

async function getEquityPrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    try {
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
      const res = await axios.get(url);

      if (res.data?.results?.length) {
        prices[symbol] = {
          price: res.data.results[0].c,
          prevClose: res.data.results[0].o
        };
      } else {
        prices[symbol] = { price: 0, prevClose: 0 };
      }
    } catch {
      prices[symbol] = { price: 0, prevClose: 0 };
    }
  }

  return prices;
}

module.exports = { getEquityPrices };

