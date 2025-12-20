/**
 * engine/market/live/equitiesLiveFeed.js
 * NON-THROWING equities feed
 */

import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY;

export async function getEquityPrices() {
  if (!POLYGON_KEY) {
    return {};
  }

  try {
    const symbols = [
      "ASML",
      "NVDA",
      "AVGO",
      "MSTR",
      "HOOD",
      "BMNR",
      "APLD"
    ];

    const results = {};

    for (const symbol of symbols) {
      const res = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
      );

      const json = await res.json();
      const price = json?.results?.[0]?.c;

      if (price) {
        results[symbol] = {
          price,
          source: "polygon"
        };
      }
    }

    return results;
  } catch {
    return {};
  }
}

