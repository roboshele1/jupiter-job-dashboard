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
 * AUTHORITATIVE POSITIONS CONTRACT (V1 LOCK)
 */
const POSITIONS = [
  { symbol: "BTC", qty: 0.251083, snapshot: 22597.47, type: "crypto" },
  { symbol: "ETH", qty: 0.25, snapshot: 702.8, type: "crypto" },

  { symbol: "NVDA", qty: 73, snapshot: 0, type: "equity" },
  { symbol: "ASML", qty: 10, snapshot: 0, type: "equity" },
  { symbol: "AVGO", qty: 74, snapshot: 0, type: "equity" },
  { symbol: "MSTR", qty: 24, snapshot: 0, type: "equity" },
  { symbol: "HOOD", qty: 70, snapshot: 0, type: "equity" },
  { symbol: "BMNR", qty: 115, snapshot: 0, type: "equity" },
  { symbol: "APLD", qty: 150, snapshot: 0, type: "equity" }
];

ipcMain.handle("portfolio:getAuthoritativeSnapshot", async () => {
  const prices = {};
  const POLY_KEY = process.env.POLYGON_API_KEY;

  try {
    // ---- CRYPTO ----
    for (const p of POSITIONS.filter(p => p.type === "crypto")) {
      const res = await axios.get(
        `https://api.coinbase.com/v2/prices/${p.symbol}-USD/spot`
      );
      prices[p.symbol] = parseFloat(res.data.data.amount);
    }

    // ---- EQUITIES ----
    for (const p of POSITIONS.filter(p => p.type === "equity")) {
      const res = await axios.get(
        `https://api.polygon.io/v2/aggs/ticker/${p.symbol}/prev?adjusted=true&apiKey=${POLY_KEY}`
      );
      prices[p.symbol] = res.data.results?.[0]?.c ?? 0;
    }

    const rows = POSITIONS.map(p => {
      const liveValue = prices[p.symbol] * p.qty;
      const delta = liveValue - p.snapshot;
      const deltaPct = p.snapshot ? (delta / p.snapshot) * 100 : 0;

      return {
        ...p,
        live: liveValue,
        delta,
        deltaPct
      };
    });

    console.log("[AUTHORITATIVE SNAPSHOT]", rows);

    return { ok: true, rows };
  } catch (err) {
    console.error("[AUTHORITATIVE SNAPSHOT ERROR]", err);
    return { ok: false, rows: [] };
  }
});

