const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jupiter", {
  getPortfolioValuation: async () => ipcRenderer.invoke("portfolio:getValuation"),
  refreshPortfolioValuation: async () => ipcRenderer.invoke("portfolio:refreshValuation")
});

