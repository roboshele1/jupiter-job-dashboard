// electron/preload.js
// JUPITER — Secure IPC Bridge (Authoritative)

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
});

