// renderer/services/livePriceAdapter.js
// READ-ONLY live price adapter (no snapshot mutation)

const MOCK_PRICES = {
  BTC: 43000,
  ETH: 2300,
  NVDA: 190,
  ASML: 780,
  AVGO: 1200,
  MSTR: 410,
  HOOD: 18,
  BMNR: 29,
  APLD: 6.2
};

export function getLivePrice(symbol) {
  return MOCK_PRICES[symbol] ?? null;
}

