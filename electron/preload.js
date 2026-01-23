// preload.js — JUPITER (env bridge + IPC bridge)
// Deterministic IPC surface for renderer

const { contextBridge, ipcRenderer } = require("electron");

// ---- SAFE ENV ----
const SAFE_ENV = {
  POLYGON_API_KEY:
    process.env.POLYGON_API_KEY ||
    process.env.POLYGON_KEY ||
    process.env.VITE_POLYGON_API_KEY ||
    process.env.POLYGON ||
    null
};

// ---- API (CANONICAL IPC SURFACE) ----
const api = {
  // Portfolio
  getPortfolioValuation: () => ipcRenderer.invoke("portfolio:getValuation"),
  refreshPortfolioValuation: () => ipcRenderer.invoke("portfolio:refreshValuation"),

  // Growth Engine
  growthEngineRun: (payload) => ipcRenderer.invoke("growthEngine:run", payload),

  // Chat
  runChatIntelligence: (payload) => ipcRenderer.invoke("chat:v2:run", payload),

  // Generic escape hatch
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),

  // ============================
  // 🔥 LIVE TELEMETRY SUBSCRIPTION
  // ============================
  on: (channel, callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  }
};

// ---- EXPOSE (AUTHORITATIVE CONTRACT) ----

// Modern / preferred
contextBridge.exposeInMainWorld("jupiter", api);

// Backward compatibility (do NOT remove)
contextBridge.exposeInMainWorld("api", api);
contextBridge.exposeInMainWorld("electronAPI", api);

// ✅ REQUIRED FOR BUILT RENDERER
// Minimal, safe electron namespace
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer)
  }
});

// Env
contextBridge.exposeInMainWorld("env", SAFE_ENV);
