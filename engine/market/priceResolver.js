/**
 * engine/market/priceResolver.js
 * D9 — Unified Price Resolver (Intraday-First, Safe Fallback)
 *
 * Strategy:
 * - Crypto → existing Coinbase path (unchanged)
 * - Equity → Polygon intraday (15-min delayed) minute bars
 * - Fallback → existing getLivePrices() (prev close / EOD)
 *
 * Guarantees:
 * - No UI changes
 * - No IPC changes
 * - No contract changes
 */

import fetch from "node-fetch";
import { getLivePrices } from "./getLivePrices.js";

const CONTRACT = "UNIFIED_PRICE_RESOLVER_V2_INTRADAY";

function normalizeType(p) {
  const t = String(p?.type || "").toLowerCase().trim();
  const a = String(p?.assetClass || "").toLowerCase().trim();
  const s = String(p?.symbol || "").toUpperCase().trim();

  if (t === "crypto" || a === "crypto" || s === "BTC" || s === "ETH") {
    return "crypto";
  }
  return "equity";
}

async function fetchIntradayPrice(symbol) {
  try {
    const now = Date.now();
    const from = now - 60 * 60 * 1000; // last 60 minutes

    const url =
      `https://api.polygon.io/v2/aggs/ticker/${symbol}` +
      `/range/1/minute/${from}/${now}` +
      `?adjusted=true&limit=1&apiKey=${process.env.POLYGON_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const candle = json?.results?.[0];

    if (!candle || typeof candle.c !== "number") return null;

    return {
      price: candle.c,
      source: "polygon-intraday-delayed",
    };
  } catch {
    return null;
  }
}

export async function resolvePrices(positions = []) {
  const fetchedAt = new Date().toISOString();

  if (!Array.isArray(positions) || positions.length === 0) {
    return Object.freeze({
      contract: CONTRACT,
      source: "unified",
      fetchedAt,
      prices: Object.freeze({}),
    });
  }

  // Build unique symbol list
  const symbols = [];
  const seen = new Set();

  for (const p of positions) {
    const s = String(p?.symbol || "").toUpperCase().trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    symbols.push(s);
  }

  // Fallback prices (existing engine behavior)
  const fallback = await getLivePrices(symbols);
  const prices = {};

  for (const p of positions) {
    const symbol = String(p?.symbol || "").toUpperCase().trim();
    if (!symbol) continue;

    const kind = normalizeType(p);

    // --- CRYPTO: unchanged ---
    if (kind === "crypto") {
      const row = fallback?.[symbol];
      prices[symbol] = {
        price: Number(row?.price) || 0,
        source: row?.source || "unknown",
        currency: "USD",
        fetchedAt,
      };
      continue;
    }

    // --- EQUITY: intraday first ---
    const intraday = await fetchIntradayPrice(symbol);

    if (intraday) {
      prices[symbol] = {
        price: intraday.price,
        source: intraday.source,
        currency: "USD",
        fetchedAt,
      };
      continue;
    }

    // --- FALLBACK ---
    const row = fallback?.[symbol];
    prices[symbol] = {
      price: Number(row?.price) || 0,
      source: row?.source || "fallback",
      currency: "USD",
      fetchedAt,
    };
  }

  return Object.freeze({
    contract: CONTRACT,
    source: "unified",
    fetchedAt,
    prices: Object.freeze(prices),
  });
}

export default Object.freeze({ resolvePrices });
