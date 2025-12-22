// electron/ipc/marketDataIpc.js
// IPC registration with injected ipc (Node-safe)

import { getCryptoPrices } from "../../engine/pricing/cryptoPriceService.js";
import { getEquitiesPrices } from "../../engine/pricing/equitiesPriceService.js";
import { MARKET_ASSETS } from "../../engine/marketDataConfig.js";

export function registerMarketDataIpc(ipc) {
  if (!ipc || typeof ipc.handle !== "function") {
    throw new Error("ipcMain not available");
  }

  ipc.handle("market:getSnapshot", async () => {
    const cryptoSymbols = MARKET_ASSETS.crypto;
    const equitySymbols = MARKET_ASSETS.equities;

    const [crypto, equities] = await Promise.all([
      getCryptoPrices(cryptoSymbols),
      getEquitiesPrices(equitySymbols),
    ]);

    return {
      crypto,
      equities,
      timestamp: Date.now(),
    };
  });
}

