const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("prices", {
  getSnapshot: async () => {
    return await ipcRenderer.invoke("prices:getSnapshot");
  }
});

