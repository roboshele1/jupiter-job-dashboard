const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getMarketSnapshot: () => ipcRenderer.invoke("get-market-snapshot"),
});

