import axios from "axios";

const POLYGON_API_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

export async function fetchLiveQuotes(symbols = ["AAPL", "MSFT", "NVDA"]) {
  const results = {};
  for (const symbol of symbols) {
    try {
      const resp = await axios.get(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
      );
      const data = resp.data.results[0];
      results[symbol] = {
        symbol,
        price: data.c,
        open: data.o,
        high: data.h,
        low: data.l,
        volume: data.v,
        timestamp: data.t
      };
    } catch (err) {
      console.error(`Polygon fetch failed for ${symbol}:`, err.message);
      results[symbol] = null;
    }
  }
  return results;
}

