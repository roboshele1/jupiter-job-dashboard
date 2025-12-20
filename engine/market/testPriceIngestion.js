// engine/market/testPriceIngestion.js
import { ingestPrices } from './priceIngestor.js';
import { getAllPrices, getPrice } from './priceEngine.js';

ingestPrices();
console.log(getAllPrices());
console.log('NVDA:', getPrice('NVDA'));

