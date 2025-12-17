// electron/engineBridge.js

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("engine", {
  getPortfolioSnapshot: () => ipcRenderer.invoke("portfolio:getSnapshot"),
});

