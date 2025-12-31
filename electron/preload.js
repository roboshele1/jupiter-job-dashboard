// preload.js — JUPITER (env bridge + IPC bridge)
// Deterministic IPC surface for renderer (NO renderer assumptions)

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

// ---- IPC CORE ----
const ipc = {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, handler) => {
    const wrapped = (_event, ...args) => handler(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  }
};

// ---- BACKWARD-COMPAT + EXPLICIT HELPERS ----
// These are REQUIRED because renderer code calls them directly.
const api = {
  // Portfolio
  getPortfolioValuation: () =>
    ipcRenderer.invoke("portfolio:getValuation"),

  refreshPortfolioValuation: () =>
    ipcRenderer.invoke("portfolio:refreshValuation"),

  // Growth Engine
  growthEngineRun: (payload) =>
    ipcRenderer.invoke("growthEngine:run", payload),

  // Generic escape hatch (kept for safety)
  invoke: ipc.invoke
};

// ---- EXPOSE ----
contextBridge.exposeInMainWorld("env", SAFE_ENV);
contextBridge.exposeInMainWorld("jupiter", api);

// Legacy aliases (do NOT remove)
contextBridge.exposeInMainWorld("api", api);
contextBridge.exposeInMainWorld("electronAPI", api);

