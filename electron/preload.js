const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("portfolio", {
  getSnapshot: () =>
    ipcRenderer.invoke("portfolio:getAuthoritativeSnapshot")
});

