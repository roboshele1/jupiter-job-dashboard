// engine/marketDataService.js
// Single responsibility: fetch live prices for crypto and equities

const COINBASE_BASE = "https://api.coinbase.com/v2/prices";
const POLYGON_BASE = "https://api.polygon.io/v2/last/trade";

// HARD-EMBED API KEY (dev only)
const POLYGON_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Market data fetch failed: ${res.status}`);
  }
  return res.json();
}

/* -------------------- CRYPTO -------------------- */

async function getCryptoPrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    const pair = `${symbol}-USD`;
    const data = await fetchJSON(`${COINBASE_BASE}/${pair}/spot`);
    prices[symbol] = Number(data.data.amount);
  }

  return prices;
}

/* -------------------- EQUITIES -------------------- */

async function getEquityPrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    const data = await fetchJSON(
      `${POLYGON_BASE}/${symbol}?apiKey=${POLYGON_KEY}`
    );
    prices[symbol] = data?.results?.p ?? null;
  }

  return prices;
}

module.exports = {
  getCryptoPrices,
  getEquityPrices,
};

