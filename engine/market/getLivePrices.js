/**
 * engine/market/getLivePrices.js
 * Live equities pricing (Polygon)
 * Safe to import from Electron main
 */

import fetch from 'node-fetch';

const POLYGON_KEY = process.env.POLYGON_API_KEY;

export async function getLivePrices() {
  if (!POLYGON_KEY) {
    return {};
  }

  const symbols = [
    'ASML',
    'NVDA',
    'AVGO',
    'MSTR',
    'HOOD',
    'BMNR',
    'APLD'
  ];

  const results = {};

  for (const symbol of symbols) {
    try {
      const res = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
      );
      const json = await res.json();

      if (json?.results?.[0]?.c) {
        results[symbol] = {
          price: json.results[0].c,
          source: 'polygon'
        };
      }
    } catch {
      // silent fail
    }
  }

  return results;
}

