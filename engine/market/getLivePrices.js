// engine/market/getLivePrices.js
// PATCHED — Parallel fetch via Promise.all (was sequential for loop)

import fetch from "node-fetch";

async function safeFetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function oneHourWindow() {
  const end = Date.now();
  const start = end - 60 * 60 * 1000;
  return { start, end };
}

function toPolygonTicker(symbol) {
  if (symbol.endsWith(".TO"))  return symbol.replace(".TO", "");
  if (symbol.endsWith(".TSX")) return symbol.replace(".TSX", "");
  if (symbol.endsWith(".V"))   return symbol.replace(".V", "");
  return symbol;
}

async function fetchTSXPrice(symbol, POLYGON_KEY) {
  const bare = symbol.replace(/\.TO$/i, "").replace(/\.TSX$/i, "");

  // Attempt 1: Polygon prev close with bare ticker
  const prev = await safeFetchJSON(
    `https://api.polygon.io/v2/aggs/ticker/${bare}/prev?adjusted=true&include_otc=true&apiKey=${POLYGON_KEY}`
  );
  const bar = prev?.results?.[0];
  if (bar && typeof bar.c === "number") {
    return { price: bar.c, source: "polygon-tsx-prev", currency: "CAD" };
  }

  // Attempt 2: Polygon snapshot endpoint
  const snap = await safeFetchJSON(
    `https://api.polygon.io/v2/snapshot/locale/global/markets/stocks/tickers/${bare}?apiKey=${POLYGON_KEY}`
  );
  const snapPrice = snap?.ticker?.day?.c ?? snap?.ticker?.prevDay?.c;
  if (snapPrice && typeof snapPrice === "number") {
    return { price: snapPrice, source: "polygon-tsx-snapshot", currency: "CAD" };
  }

  // Attempt 3: Yahoo Finance (no key, public)
  const yahoo = await safeFetchJSON(
    `https://query1.finance.yahoo.com/v8/finance/chart/${bare}.TO?interval=1d&range=1d`
  );
  const yahooPrice = yahoo?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (yahooPrice && typeof yahooPrice === "number") {
    return { price: yahooPrice, source: "yahoo-tsx", currency: "CAD" };
  }

  return { price: null, source: "unavailable", currency: "CAD" };
}

async function fetchSinglePrice(symbol, POLYGON_KEY) {
  // CRYPTO → COINBASE
  if (symbol === "BTC" || symbol === "ETH" || symbol === "SOL") {
    const json = await safeFetchJSON(
      `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
    );
    return [symbol, {
      price:  json?.data?.amount ? Number(json.data.amount) : null,
      source: json ? "coinbase-spot" : "unavailable",
    }];
  }

  // TSX → dedicated TSX fetcher
  if (symbol.endsWith(".TO") || symbol.endsWith(".TSX")) {
    const result = await fetchTSXPrice(symbol, POLYGON_KEY);
    return [symbol, result];
  }

  // EQUITY → POLYGON INTRADAY → FALLBACK PREV CLOSE
  const polygonTicker = toPolygonTicker(symbol);
  const { start, end } = oneHourWindow();
  let resolved = null;

  if (POLYGON_KEY) {
    const [intraday, prev] = await Promise.all([
      safeFetchJSON(
        `https://api.polygon.io/v2/aggs/ticker/${polygonTicker}/range/1/minute/${start}/${end}?adjusted=true&limit=1&include_otc=true&apiKey=${POLYGON_KEY}`
      ),
      safeFetchJSON(
        `https://api.polygon.io/v2/aggs/ticker/${polygonTicker}/prev?adjusted=true&include_otc=true&apiKey=${POLYGON_KEY}`
      ),
    ]);

    const candle = intraday?.results?.[0];
    if (candle && typeof candle.c === "number") {
      resolved = { price: candle.c, source: "polygon-intraday-delayed" };
    } else {
      const bar = prev?.results?.[0];
      if (bar && typeof bar.c === "number") {
        resolved = { price: bar.c, source: "polygon-prev-close" };
      }
    }
  }

  return [symbol, resolved ?? { price: null, source: "unavailable" }];
}

export async function getLivePrices(symbols = []) {
  const POLYGON_KEY = process.env.POLYGON_API_KEY;
  if (!Array.isArray(symbols) || symbols.length === 0) return Object.freeze({});

  // ALL symbols fetched in parallel
  const entries = await Promise.all(
    symbols.map(s => fetchSinglePrice(s, POLYGON_KEY))
  );

  return Object.freeze(Object.fromEntries(
    entries.map(([sym, val]) => [sym, Object.freeze(val)])
  ));
}
