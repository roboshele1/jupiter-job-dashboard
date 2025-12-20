const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('price', {
  getLive: async () => {
    const data = await ipcRenderer.invoke('price:getLive');
    return { ok: true, data };
  }
});

