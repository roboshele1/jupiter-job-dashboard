// engine/priceService.js
// D33.1 — Live Price Service (FOUNDATION)
// READ-ONLY • ESM • Deterministic contract
// Crypto source: Coinbase (BTC, ETH)

import axios from "axios";

const COINBASE_BASE = "https://api.coinbase.com/v2/prices";

async function fetchCoinbasePrice(symbol) {
  try {
    const pair = `${symbol}-USD`;
    const r = await axios.get(`${COINBASE_BASE}/${pair}/spot`);
    const amount = Number(r?.data?.data?.amount);
    return Number.isFinite(amount) ? amount : null;
  } catch {
    return null;
  }
}

/**
 * getPrices
 * Returns a flat price map used by engines.
 * Keys may be missing if a source fails.
 */
export async function getPrices(symbols = []) {
  const out = {};
  const unique = Array.from(new Set(symbols));

  // Crypto (Coinbase)
  for (const s of unique) {
    if (s === "BTC" || s === "ETH") {
      out[s] = await fetchCoinbasePrice(s);
    }
  }

  return out;
}
