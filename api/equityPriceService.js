import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY;

export async function fetchEquityPrices(symbols) {
  const results = {};

  for (const symbol of symbols) {
    try {
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json?.results?.[0]?.c) {
        results[symbol] = json.results[0].c;
      } else {
        results[symbol] = null;
      }
    } catch {
      results[symbol] = null;
    }
  }

  return results;
}

