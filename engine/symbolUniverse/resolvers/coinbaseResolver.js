// Node-only resolver for crypto symbols via Coinbase products
// Strict: accepts only true spot crypto bases (USD-quoted)

import fetch from "node-fetch";

const COINBASE_PRODUCTS = "https://api.exchange.coinbase.com/products";

// Known non-crypto symbols that may appear in Coinbase products
const NON_CRYPTO_SYMBOLS = new Set([
  "SPX",
  "NDX",
  "DJI",
  "RUT",
  "FTSE"
]);

export async function coinbaseResolver(symbol) {
  if (NON_CRYPTO_SYMBOLS.has(symbol)) return null;

  try {
    const res = await fetch(COINBASE_PRODUCTS, { timeout: 5000 });
    if (!res.ok) return null;

    const products = await res.json();
    if (!Array.isArray(products)) return null;

    const hit = products.find(
      p =>
        p?.base_currency === symbol &&
        p?.quote_currency === "USD" &&
        p?.status === "online"
    );

    if (!hit) return null;

    return {
      valid: true,
      assetType: "crypto",
      canonicalSymbol: hit.base_currency,
      source: "coinbase"
    };
  } catch {
    return null;
  }
}
