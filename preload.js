// preload.js — JUPITER (env bridge + IPC bridge)
// Goal: expose a safe, minimal env surface to renderer WITHOUT touching Risk/Portfolio authority

const { contextBridge, ipcRenderer } = require("electron");

// Only expose the specific keys we intentionally allow in the renderer.
// (Do NOT dump full process.env into window.)
const SAFE_ENV = {
  POLYGON_API_KEY:
    process.env.POLYGON_API_KEY ||
    process.env.POLYGON_KEY ||
    process.env.VITE_POLYGON_API_KEY || // ← MISSING LINK (THIS WAS THE BUG)
    process.env.POLYGON ||
    null
};

const ipc = {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, handler) => {
    const wrapped = (_event, ...args) => handler(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  }
};

// Primary
contextBridge.exposeInMainWorld("env", SAFE_ENV);
contextBridge.exposeInMainWorld("jupiter", ipc);

// Backward-compat aliases
contextBridge.exposeInMainWorld("api", ipc);
contextBridge.exposeInMainWorld("electronAPI", ipc);

