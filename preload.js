// preload.js
// Full replacement file — Append-only
const { contextBridge, ipcRenderer } = require("electron");

// Expose minimal environment safely
const SAFE_ENV = {
  POLYGON_API_KEY:
    process.env.POLYGON_API_KEY ||
    process.env.POLYGON_KEY ||
    process.env.VITE_POLYGON_API_KEY ||
    process.env.POLYGON ||
    null
};

// Append-only: expose IPC channels safely to renderer
const ipc = {
  invoke: (channel, payload) => {
    const validChannels = [
      'systemState:get',
      'portfolio:get',
      'signals:get',
      'decisions:get'
    ];
    if (!validChannels.includes(channel)) throw new Error(`Invalid IPC channel: ${channel}`);
    return ipcRenderer.invoke(channel, payload);
  },
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, handler) => {
    const wrapped = (_event, ...args) => handler(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  }
};

// Primary exposure
contextBridge.exposeInMainWorld("env", SAFE_ENV);
contextBridge.exposeInMainWorld("jupiter", ipc);

// Backward-compat aliases
contextBridge.exposeInMainWorld("api", ipc);
contextBridge.exposeInMainWorld("electronAPI", ipc);
