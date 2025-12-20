// engine/market/priceIngestor.js
import { fetchPrices } from './providers/mockProvider.js';
import { setPrices } from './priceEngine.js';

export function ingestPrices() {
  const prices = fetchPrices();
  setPrices(prices);
  return prices;
}

