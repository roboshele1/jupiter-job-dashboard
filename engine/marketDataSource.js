// engine/marketDataSource.js
// Phase 5 — Live Market Data Source (backend only)
// Providers: Polygon (Equities), Coinbase (Crypto)
// Read-only, deterministic, normalized

import fetch from "node-fetch";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_BASE = "https://api.polygon.io";
const COINBASE_BASE = "https://api.coinbase.com/v2/exchange-rates";

/**
 * Fetch live equity prices from Polygon
 * @param {string[]} symbols - e.g. ["AAPL", "NVDA"]
 */
async function fetchEquityPrices(symbols) {
  if (!POLYGON_API_KEY || !symbols || symbols.length === 0) return {};

  const prices = {};

  for (const symbol of symbols) {
    const url = `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (json?.results?.[0]?.c) {
        prices[symbol] = {
          price: json.results[0].c,
          currency: "USD"
        };
      }
    } catch (err) {
      // Silent fail — upstream snapshot will flag missing data
    }
  }

  return prices;
}

/**
 * Fetch live crypto prices from Coinbase
 * @param {string[]} symbols - e.g. ["BTC", "ETH"]
 */
async function fetchCryptoPrices(symbols) {
  if (!symbols || symbols.length === 0) return {};

  const prices = {};

  for (const symbol of symbols) {
    try {
      const url = `${COINBASE_BASE}?currency=${symbol}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json?.data?.rates?.USD) {
        prices[symbol] = {
          price: Number(json.data.rates.USD),
          currency: "USD"
        };
      }
    } catch (err) {
      // Silent fail — upstream snapshot will flag missing data
    }
  }

  return prices;
}

/**
 * Canonical live market snapshot
 * No calculations, no opinions
 */
export async function fetchLiveMarketSnapshot() {
  const timestamp = new Date().toISOString();

  const equityPrices = await fetchEquityPrices([
    "AAPL",
    "NVDA",
    "MSFT",
    "TSLA"
  ]);

  const cryptoPrices = await fetchCryptoPrices([
    "BTC",
    "ETH"
  ]);

  return {
    source: "live",
    timestamp,
    prices: {
      ...equityPrices,
      ...cryptoPrices
    }
  };
}

