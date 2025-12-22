const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('market', {
  getSnapshot: () => ipcRenderer.invoke('market:getSnapshot')
});

