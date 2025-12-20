// engine/market/priceEngine.js

let prices = {};

export function setPrices(newPrices) {
  prices = {
    ...newPrices,
    ts: Date.now()
  };
}

export function getPrice(symbol) {
  return prices[symbol] ?? null;
}

export function getAllPrices() {
  return prices;
}

