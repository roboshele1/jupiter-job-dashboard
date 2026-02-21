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
