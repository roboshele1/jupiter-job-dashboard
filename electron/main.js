import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

ipcMain.handle("prices:getCryptoPrices", async () => {
  const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");
  const json = await res.json();
  return {
    BTC: Number(json.data.rates.BTC) ** -1,
    ETH: Number(json.data.rates.ETH) ** -1,
  };
});

ipcMain.handle("prices:getEquityPrices", async () => {
  return {};
});

