const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jupiter', {
  getSnapshot: () => ipcRenderer.invoke('portfolio:getSnapshot'),
  getLivePrices: () => ipcRenderer.invoke('market:getLivePrices'),
});

