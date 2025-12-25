// electron/main.js

import { app, BrowserWindow } from "electron";
import path from "path";

import { registerPortfolioIpc } from "./ipc/portfolioIpc.js";
import { registerDashboardIpc } from "./ipc/dashboardIpc.js";
import { registerRiskIpc } from "./ipc/riskIpc.js";
import { registerRiskAlertsIpc } from "./ipc/riskAlertsIpc.js";

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(process.cwd(), "electron/preload.js"),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile("dist/index.html");
  }
}

app.whenReady().then(() => {
  // IPC registration (order is explicit and intentional)
  registerPortfolioIpc();
  registerDashboardIpc();
  registerRiskIpc();
  registerRiskAlertsIpc();

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

