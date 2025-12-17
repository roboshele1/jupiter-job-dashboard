const { contextBridge, ipcRenderer } = require("electron");

/**
 * Preload Bridge — v1
 * RULES:
 * - Explicit allowlist only
 * - No business logic
 * - No mutation
 */

contextBridge.exposeInMainWorld("jupiter", {
  portfolio: {
    getSnapshot: () => ipcRenderer.invoke("portfolio:getSnapshot")
  }
});

