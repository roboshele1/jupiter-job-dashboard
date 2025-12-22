// engine/marketSnapshotService.js
// Canonical market snapshot (terminal-first, Electron-agnostic)

import { getCryptoPrices } from "./pricing/cryptoPriceService.js";
import { getEquitiesPrices } from "./pricing/equitiesPriceService.js";

const CRYPTO_SYMBOLS = ["BTC-USD", "ETH-USD"];
const EQUITY_SYMBOLS = ["ASML", "NVDA", "AVGO", "MSTR", "HOOD", "BMNR", "APLD"];

export async function getMarketSnapshot() {
  const [crypto, equities] = await Promise.all([
    getCryptoPrices(CRYPTO_SYMBOLS),
    getEquitiesPrices(EQUITY_SYMBOLS),
  ]);

  return {
    crypto,
    equities,
    timestamp: Date.now(),
  };
}

