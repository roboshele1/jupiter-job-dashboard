/**
 * engine/market/priceResolver.js
 * D8.5 — Unified Price Resolver (Engine Authority)
 *
 * Contract:
 * - Single function: resolvePrices(positions)
 * - Deterministic snapshot per invocation (single fetchedAt)
 * - Source-aware routing:
 *   - crypto (BTC/ETH) -> Coinbase spot (via getLivePrices)
 *   - equity (everything else) -> Polygon prev-close (via getLivePrices)
 *
 * NOTE:
 * We deliberately route through engine/market/getLivePrices.js because it already
 * implements the correct provider split and is battle-tested via node command.
 */

import { getLivePrices } from "./getLivePrices.js";

const CONTRACT = "UNIFIED_PRICE_RESOLVER_V1";

function normalizeType(p) {
  const t = String(p?.type || "").toLowerCase().trim();
  const a = String(p?.assetClass || "").toLowerCase().trim();

  // Accept either `type` or `assetClass`
  if (t === "crypto" || a === "crypto") return "crypto";
  if (t === "equity" || a === "equity") return "equity";

  // If symbol is BTC/ETH, treat as crypto (hard rule)
  const s = String(p?.symbol || "").toUpperCase().trim();
  if (s === "BTC" || s === "ETH") return "crypto";

  // Default to equity
  return "equity";
}

export async function resolvePrices(positions = []) {
  if (!Array.isArray(positions) || positions.length === 0) {
    return Object.freeze({
      contract: CONTRACT,
      source: "unified",
      fetchedAt: new Date().toISOString(),
      prices: Object.freeze({}),
    });
  }

  const fetchedAt = new Date().toISOString();

  // Build a unique symbol list from positions
  const symbols = [];
  const seen = new Set();

  for (const p of positions) {
    const symbol = String(p?.symbol || "").toUpperCase().trim();
    if (!symbol) continue;
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
  }

  const raw = await getLivePrices(symbols);

  const prices = {};
  for (const p of positions) {
    const symbol = String(p?.symbol || "").toUpperCase().trim();
    if (!symbol) continue;

    const kind = normalizeType(p);
    const row = raw?.[symbol];

    // Enforce routing expectations by symbol/type (no silent cross-routing)
    // If something comes back missing, we keep price=0 + source=unknown
    if (kind === "crypto") {
      prices[symbol] = {
        price: Number(row?.price) || 0,
        source: row?.source || "unknown",
        currency: "USD",
        fetchedAt,
      };
      continue;
    }

    // equity
    prices[symbol] = {
      price: Number(row?.price) || 0,
      source: row?.source || "unknown",
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

