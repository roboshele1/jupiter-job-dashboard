/**
 * Market Data Adapter
 * Fetches raw market + financial data and normalizes into asset state
 */

const fetch = require('node-fetch');
const assetStateNormalizer = require('../normalizers/assetStateNormalizer');

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
if (!POLYGON_API_KEY) {
  throw new Error('POLYGON_API_KEY missing from environment');
}

const BASE_URL = 'https://api.polygon.io';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Polygon API error: ${res.status}`);
  }
  return res.json();
}

module.exports = async function marketDataAdapter(symbol) {
  const upper = symbol.toUpperCase();

  // --- PRICE / VOLUME ---
  const tickerDetails = await fetchJSON(
    `${BASE_URL}/v3/reference/tickers/${upper}?apiKey=${POLYGON_API_KEY}`
  );

  const aggregates = await fetchJSON(
    `${BASE_URL}/v2/aggs/ticker/${upper}/range/1/day/2025-01-01/2026-01-20?adjusted=true&sort=desc&limit=90&apiKey=${POLYGON_API_KEY}`
  );

  // --- FINANCIALS ---
  const financials = await fetchJSON(
    `${BASE_URL}/vX/reference/financials?ticker=${upper}&limit=1&apiKey=${POLYGON_API_KEY}`
  );

  const raw = {
    symbol: upper,
    assetClass: 'EQUITY',

    market: {
      price: {
        last: aggregates?.results?.[0]?.c || 0,
        change30d:
          aggregates?.results?.length >= 30
            ? (aggregates.results[0].c - aggregates.results[29].c) /
              aggregates.results[29].c
            : 0
      },
      volume: {
        avg30d:
          aggregates?.results
            ?.slice(0, 30)
            .reduce((a, b) => a + (b.v || 0), 0) / 30 || 0,
        recent5d:
          aggregates?.results
            ?.slice(0, 5)
            .reduce((a, b) => a + (b.v || 0), 0) / 5 || 0
      },
      volatility: {
        atr14: 0, // computed later by volatility engine
        atr90: 0
      },
      venue: tickerDetails?.results?.primary_exchange || 'UNKNOWN'
    },

    liquidity: {
      avgDailyDollarVolume:
        aggregates?.results?.[0]?.v *
          aggregates?.results?.[0]?.c || 0,
      trend: 'STABLE'
    },

    balanceSheet: {
      cashRunwayMonths:
        financials?.results?.[0]?.financials?.cash_and_cash_equivalents?.value
          ? 18
          : 0
    },

    structure: {
      dilutionRisk: false,
      reverseSplits: 0
    }
  };

  return assetStateNormalizer(raw);
};
