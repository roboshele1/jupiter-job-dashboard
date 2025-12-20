/**
 * cryptoPriceBridge.js
 * Mirrors equities IPC bridge exactly
 */

import { fetchLiveCryptoPrice } from "../market/live/cryptoLiveFeed.js";

export function registerCryptoPriceBridge(ipcMain) {
  ipcMain.handle("price:getCryptoLive", async (_event, symbol) => {
    return await fetchLiveCryptoPrice(symbol);
  });
}

