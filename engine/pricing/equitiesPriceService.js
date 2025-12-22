// engine/pricing/equitiesPriceService.js
// LIVE Polygon equities pricing — V1 authoritative

const POLYGON_API_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Polygon fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function getEquitiesPrices(symbols = []) {
  const results = [];

  for (const symbol of symbols) {
    try {
      const data = await fetchJSON(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
      );

      const candle = data?.results?.[0];

      results.push({
        symbol,
        price: candle ? candle.c : null,
        source: "polygon"
      });
    } catch (err) {
      results.push({
        symbol,
        price: null,
        source: "polygon-error"
      });
    }
  }

  return results;
}

