// engine/symbolUniverse/resolvers/coinbaseResolver.js
// COINBASE CRYPTO RESOLVER — V2 (AUTHORITATIVE)
// --------------------------------------------
// Resolves native crypto assets ONLY (BTC, ETH, etc).
// Explicit allowlist to prevent ETF / equity contamination.
// Must execute BEFORE Polygon resolver.
//
// Rules:
// - Native crypto symbols only
// - Fail-closed
// - Deterministic
// - No ETF resolution
// - No fallback guessing

const NATIVE_CRYPTO_ALLOWLIST = Object.freeze({
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    currency: "USD"
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    currency: "USD"
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    currency: "USD"
  },
  ADA: {
    symbol: "ADA",
    name: "Cardano",
    currency: "USD"
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    currency: "USD"
  }
});

export async function coinbaseResolver(inputSymbol) {
  if (!inputSymbol || typeof inputSymbol !== "string") return null;

  const sym = inputSymbol.trim().toUpperCase();

  const meta = NATIVE_CRYPTO_ALLOWLIST[sym];
  if (!meta) return null;

  return Object.freeze({
    symbol: meta.symbol,
    name: meta.name,
    exchange: "CRYPTO",
    country: "GLOBAL",
    currency: meta.currency,
    assetClass: "crypto",
    source: "coinbaseResolver",
    canonical: true
  });
}

export default Object.freeze({
  coinbaseResolver
});
