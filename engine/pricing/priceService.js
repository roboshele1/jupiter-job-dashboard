// engine/pricing/priceService.js
// JUPITER — Price Service (AUTHORITATIVE)

export async function getLivePrice(symbol, source) {
  // TEMP deterministic pricing until feeds are wired
  const mockPrices = {
    ASML: 1056.02,
    NVDA: 495.0,
    AVGO: 1210.0,
    MSTR: 415.0,
    HOOD: 18.2,
    BMNR: 42.1,
    APLD: 16.8,
    BTC: 118000,
    ETH: 3900,
  };

  return {
    price: mockPrices[symbol] ?? 0,
    source: "mock",
  };
}

