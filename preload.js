const { contextBridge, ipcRenderer } = require("electron");

/**
 * JUPITER Preload Bridge — v1
 * RULES:
 * - Expose ONE canonical API
 * - No computation
 * - No mutation
 * - No fallback logic
 * - Pass-through only
 */

contextBridge.exposeInMainWorld("jupiter", {
  portfolio: {
    /**
     * Fetch canonical PortfolioSnapshot from engine via IPC
     * @returns {Promise<PortfolioSnapshot>}
     */
    getSnapshot: () => {
      return ipcRenderer.invoke("portfolio:getSnapshot");
    }
  }
});

