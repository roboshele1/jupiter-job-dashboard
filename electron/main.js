import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import axios from "axios";
import "dotenv/config";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(process.cwd(), "electron/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

/**
 * LIVE PRICE SNAPSHOT (AUTHORITATIVE)
 * - Equities: Polygon
 * - Crypto: Coinbase
 */
ipcMain.handle("prices:getSnapshot", async () => {
  const snapshot = {};

  try {
    // ---- CRYPTO (LIVE) ----
    for (const symbol of ["BTC", "ETH"]) {
      const pair = `${symbol}-USD`;
      const res = await axios.get(
        `https://api.coinbase.com/v2/prices/${pair}/spot`
      );

      snapshot[symbol] = {
        price: parseFloat(res.data.data.amount),
        source: "coinbase"
      };
    }

    // ---- EQUITIES (LIVE) ----
    const POLY_KEY = process.env.POLYGON_API_KEY;

    for (const symbol of ["NVDA", "ASML", "AVGO", "MSTR", "HOOD", "BMNR", "APLD"]) {
      const res = await axios.get(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLY_KEY}`
      );

      snapshot[symbol] = {
        price: res.data.results?.[0]?.c ?? 0,
        source: "polygon"
      };
    }

    return { ok: true, data: snapshot };
  } catch (err) {
    console.error("[SNAPSHOT ERROR]", err);
    return { ok: false, data: {} };
  }
});

