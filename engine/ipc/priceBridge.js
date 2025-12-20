/**
 * engine/ipc/priceBridge.js
 * Hardened IPC price bridge
 * IPC is registered unconditionally and NEVER throws
 */

import { ipcMain } from "electron";
import { getEquityPrices } from "../market/live/equitiesLiveFeed.js";
import { getCryptoPrices } from "../market/live/cryptoLiveFeed.js";

export function registerPriceBridge() {
  ipcMain.handle("price:getLive", async () => {
    try {
      const equities = await getEquityPrices().catch(() => ({}));
      const crypto = await getCryptoPrices().catch(() => ({}));

      return {
        ok: true,
        data: {
          ...equities,
          ...crypto
        }
      };
    } catch (err) {
      return {
        ok: false,
        data: {},
        error: err?.message || "price bridge failure"
      };
    }
  });
}

