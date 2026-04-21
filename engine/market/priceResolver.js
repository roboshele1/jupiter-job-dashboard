// engine/market/priceResolver.js
// PATCHED — Parallel intraday fetch via Promise.all (was sequential for loop)

import fetch from "node-fetch";
import { getLivePrices } from "./getLivePrices.js";

const CONTRACT = "UNIFIED_PRICE_RESOLVER_V2_INTRADAY";

function normalizeType(p) {
  const t = String(p?.type || "").toLowerCase().trim();
  const a = String(p?.assetClass || "").toLowerCase().trim();
  const s = String(p?.symbol || "").toUpperCase().trim();
  if (t === "crypto" || a === "crypto" || s === "BTC" || s === "ETH" || s === "SOL") {
    return "crypto";
  }
  return "equity";
}

async function fetchIntradayPrice(symbol) {
  try {
    const now  = Date.now();
    const from = now - 60 * 60 * 1000;
    const url  =
      `https://api.polygon.io/v2/aggs/ticker/${symbol}` +
      `/range/1/minute/${from}/${now}` +
      `?adjusted=true&limit=1&include_otc=true&apiKey=${process.env.POLYGON_API_KEY}`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const candle = json?.results?.[0];
    if (!candle || typeof candle.c !== "number") return null;
    return { price: candle.c, source: "polygon-intraday-delayed" };
  } catch {
    return null;
  }
}

export async function resolvePrices(positions = []) {
  const fetchedAt = new Date().toISOString();

  if (!Array.isArray(positions) || positions.length === 0) {
    return Object.freeze({
      contract: CONTRACT, source: "unified", fetchedAt,
      prices: Object.freeze({}),
    });
  }

  const symbols = [...new Set(
    positions.map(p => String(p?.symbol || "").toUpperCase().trim()).filter(Boolean)
  )];

  // Fetch fallback prices AND intraday for all equities — all in parallel
  const equitySymbols = positions
    .filter(p => normalizeType(p) === "equity")
    .map(p => String(p.symbol).toUpperCase().trim());

  const [fallback, ...intradayResults] = await Promise.all([
    getLivePrices(symbols),
    ...equitySymbols.map(s => fetchIntradayPrice(s).then(r => [s, r]))
  ]);

  const intradayMap = Object.fromEntries(intradayResults);

  const prices = {};
  for (const p of positions) {
    const symbol = String(p?.symbol || "").toUpperCase().trim();
    if (!symbol) continue;

    const kind = normalizeType(p);

    if (kind === "crypto") {
      const row = fallback?.[symbol];
      prices[symbol] = { price: Number(row?.price) || 0, source: row?.source || "unknown", currency: "USD", fetchedAt };
      continue;
    }

    const isTSX = symbol.endsWith(".TO") || symbol.endsWith(".TSX");
    const intraday = intradayMap[symbol];
    if (intraday) {
      prices[symbol] = { price: intraday.price, source: intraday.source, currency: isTSX ? "CAD" : "USD", fetchedAt };
      continue;
    }

    const row = fallback?.[symbol];
    prices[symbol] = { price: Number(row?.price) || 0, source: row?.source || "fallback", currency: isTSX ? "CAD" : "USD", fetchedAt };
  }

  return Object.freeze({
    contract: CONTRACT, source: "unified", fetchedAt,
    prices: Object.freeze(prices),
  });
}

export default Object.freeze({ resolvePrices });
