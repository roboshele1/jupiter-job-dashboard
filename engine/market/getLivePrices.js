// engine/market/getLivePrices.js
// D8.6 — Source-aware price routing (INTRADAY-ENABLED, HARDENED)
// Canadian stocks supported via Polygon ticker format conversion
// Equity  → Polygon intraday (15-min delayed) → fallback prev close
// Crypto  → Coinbase (spot)
// Read-only, deterministic, NO THROW guarantee

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

// Convert user-facing symbol to Polygon ticker format
// CSU.TO → X:CSU.TO is wrong — Polygon uses CSU for TSX on global endpoint
// For Canadian stocks ending in .TO, strip the suffix for prev-close lookup
function toPolygonTicker(symbol) {
  if (symbol.endsWith(".TO"))  return symbol.replace(".TO", "");
  if (symbol.endsWith(".TSX")) return symbol.replace(".TSX", "");
  if (symbol.endsWith(".V"))   return symbol.replace(".V", "");
  return symbol;
}

export async function getLivePrices(symbols = []) {
  const POLYGON_KEY = process.env.POLYGON_API_KEY;
  if (!Array.isArray(symbols)) return Object.freeze({});

  const prices = {};

  for (const symbol of symbols) {
    // CRYPTO → COINBASE (SPOT)
    if (symbol === "BTC" || symbol === "ETH") {
      const json = await safeFetchJSON(
        `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
      );
      prices[symbol] = Object.freeze({
        price:  json?.data?.amount ? Number(json.data.amount) : null,
        source: json ? "coinbase-spot" : "unavailable",
      });
      continue;
    }

    // EQUITY + CANADIAN → POLYGON INTRADAY → FALLBACK PREV CLOSE
    const polygonTicker = toPolygonTicker(symbol);
    const { start, end } = oneHourWindow();
    let resolved = null;

    if (POLYGON_KEY) {
      // Try intraday first
      const intraday = await safeFetchJSON(
        `https://api.polygon.io/v2/aggs/ticker/${polygonTicker}/range/1/minute/${start}/${end}?adjusted=true&limit=1&apiKey=${POLYGON_KEY}`
      );
      const candle = intraday?.results?.[0];
      if (candle && typeof candle.c === "number") {
        resolved = { price: candle.c, source: "polygon-intraday-delayed" };
      }

      // Fallback to prev close
      if (!resolved) {
        const prev = await safeFetchJSON(
          `https://api.polygon.io/v2/aggs/ticker/${polygonTicker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
        );
        const bar = prev?.results?.[0];
        if (bar && typeof bar.c === "number") {
          resolved = { price: bar.c, source: "polygon-prev-close" };
        }
      }
    }

    prices[symbol] = Object.freeze(
      resolved ?? { price: null, source: "unavailable" }
    );
  }

  return Object.freeze(prices);
}
