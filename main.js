// main.js — Electron entry (AUTHORITATIVE ENV LOAD)

import "dotenv/config"; // <-- MUST BE FIRST LINE

import { app, BrowserWindow } from "electron";
import path from "path";

import { registerPortfolioIpc } from "./electron/ipc/portfolioIpc.js";
import { registerDashboardIpc } from "./electron/ipc/dashboardIpc.js";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(process.cwd(), "preload.js"),
      contextIsolation: true
    }
  });

  mainWindow.loadURL("http://localhost:5173");

  registerPortfolioIpc();
  registerDashboardIpc();
}

app.whenReady().then(createWindow);

