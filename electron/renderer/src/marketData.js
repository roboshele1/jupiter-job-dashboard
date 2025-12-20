// V1 MARKET DATA STUB
// Deterministic, renderer-safe, read-only

export async function fetchLastQuote(symbol) {
  return {
    symbol,
    price: 0,
    change: 0,
    PL: 0,
    timestamp: Date.now(),
  };
}

