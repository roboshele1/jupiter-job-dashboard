const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jupiter", {
  // ===== PORTFOLIO (AUTHORITATIVE SOURCE) =====
  getPortfolioValuation: async () =>
    ipcRenderer.invoke("portfolio:getValuation"),

  refreshPortfolioValuation: async () =>
    ipcRenderer.invoke("portfolio:refreshValuation"),

  // ===== RISK (DERIVED FROM PORTFOLIO SNAPSHOT) =====
  getRiskSnapshot: async () =>
    ipcRenderer.invoke("risk:getSnapshot")
});

