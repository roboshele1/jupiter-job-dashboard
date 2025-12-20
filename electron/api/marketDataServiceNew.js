// V1 RENDERER-SAFE STUB
// Live market data intentionally disabled for V1

export async function fetchLastQuote() {
  return {
    symbol: "STUB",
    price: 0,
    timestamp: Date.now()
  };
}

export async function getMarketData() {
  return {
    status: "stub",
    message: "Market data disabled in V1"
  };
}

