const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jupiter", {
  getMarketSnapshot: async () => {
    return await ipcRenderer.invoke("get-market-snapshot");
  }
});

