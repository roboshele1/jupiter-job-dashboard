/**
 * coinbaseResolver.js
 * Resolves crypto symbols via live Coinbase API — no hardcoded allowlist.
 * Any valid Coinbase spot product (XRP-USD, DOGE-USD, etc.) resolves as crypto.
 */

const COINBASE_API = "https://api.coinbase.com/v2/currencies/crypto";
const PRODUCT_API  = "https://api.exchange.coinbase.com/products";

// Cache to avoid repeated API calls within the same session
let _productCache = null;
let _cacheTime    = 0;
const CACHE_TTL   = 1000 * 60 * 60; // 1 hour

async function getCoinbaseProducts() {
  const now = Date.now();
  if (_productCache && (now - _cacheTime) < CACHE_TTL) return _productCache;

  const res  = await fetch(PRODUCT_API);
  if (!res.ok) throw new Error(`Coinbase products fetch failed: ${res.status}`);
  const data = await res.json();

  // Build a map of base currency → product info (USD pairs only)
  const map = {};
  for (const p of data) {
    if (p.quote_currency === "USD" && p.status === "online") {
      map[p.base_currency.toUpperCase()] = {
        symbol:   p.base_currency.toUpperCase(),
        name:     p.display_name?.replace("/USD", "").trim() || p.base_currency,
        currency: "USD",
        id:       p.id
      };
    }
  }

  _productCache = map;
  _cacheTime    = now;
  return map;
}

export async function coinbaseResolver(inputSymbol) {
  if (!inputSymbol || typeof inputSymbol !== "string") return null;

  const sym = inputSymbol.trim().toUpperCase();

  try {
    const products = await getCoinbaseProducts();
    const meta     = products[sym];
    if (!meta) return null;

    return Object.freeze({
      symbol:    meta.symbol,
      name:      meta.name,
      exchange:  "CRYPTO",
      country:   "GLOBAL",
      currency:  meta.currency,
      assetClass: "crypto",
      source:    "coinbaseResolver",
      canonical: true
    });
  } catch {
    return null;
  }
}

export default Object.freeze({ coinbaseResolver });
