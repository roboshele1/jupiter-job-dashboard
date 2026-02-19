/**
 * cryptoPriceBridge.js
 * Fixed to use actual export: getCryptoPrices() from cryptoLiveFeed.js
 * Returns { BTC: { price, source }, ETH: { price, source } }
 */

import { getCryptoPrices } from "../market/live/cryptoLiveFeed.js";

export function registerCryptoPriceBridge(ipcMain) {
  // price:getCryptoLive — called by Signals tab crypto panel
  // Accepts optional symbol string; returns full prices object regardless
  ipcMain.handle("price:getCryptoLive", async (_event, symbol) => {
    const prices = await getCryptoPrices();
    if (symbol && prices[symbol] !== undefined) {
      return prices[symbol];
    }
    return prices;
  });
}
