import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fetchEquityPrices } from "./api/equityPriceService.js";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadURL("http://localhost:5173");
}

ipcMain.handle("get-equity-prices", async (_, symbols) => {
  return await fetchEquityPrices(symbols);
});

app.whenReady().then(createWindow);

