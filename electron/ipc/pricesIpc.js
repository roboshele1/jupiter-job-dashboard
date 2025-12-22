import electronPkg from "electron";
import { getCryptoPrices } from "../engine/pricing/cryptoPriceService.js";

const { ipcMain } = electronPkg;

export async function registerPricesIpc() {
  // Guard: allow terminal execution without Electron runtime
  if (!ipcMain || typeof ipcMain.handle !== "function") {
    return;
  }

  ipcMain.handle("prices:getSnapshot", async () => {
    const prices = await getCryptoPrices(["BTC-USD", "ETH-USD"]);
    return {
      crypto: prices,
      timestamp: Date.now(),
    };
  });
}

