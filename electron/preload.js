import { contextBridge, ipcRenderer } from 'electron';

/**
 * Hardened IPC bridge
 * Exposed safely to renderer
 */
contextBridge.exposeInMainWorld('price', {
  getLive: async () => {
    try {
      return await ipcRenderer.invoke('price:getLive');
    } catch (err) {
      return { ok: false, data: {} };
    }
  }
});

