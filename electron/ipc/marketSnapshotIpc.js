import { ipcMain } from 'electron';
import { getMarketSnapshot } from '../../engine/marketSnapshotService.js';

let interval = null;

export function registerMarketSnapshotIpc(win) {
  ipcMain.handle('market:getSnapshot', async () => {
    return await getMarketSnapshot();
  });

  ipcMain.handle('market:start', () => {
    if (interval) return;

    interval = setInterval(async () => {
      const data = await getMarketSnapshot();
      win.webContents.send('market:snapshot', data);
    }, 10000);
  });

  ipcMain.handle('market:stop', () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  });
}

