// preload.js

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("jupiter", {
  getPortfolioSnapshot: () => ipcRenderer.invoke("portfolio:getSnapshot"),
  getRiskSnapshot: () => ipcRenderer.invoke("risk:getSnapshot"),
});

