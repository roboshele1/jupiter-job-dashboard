// electron/ipc/daemonControlIpc.js
// Control background monitor daemon from frontend

import {
  startBackgroundMonitorDaemon,
  stopBackgroundMonitorDaemon,
  getConvictionCache,
  getAlertLog,
  isDaemonRunning,
} from '../daemon/backgroundMonitorDaemon.js';

export function registerDaemonControlIpc(ipcMain, broadcasterCallback) {

  // Start daemon
  ipcMain.handle('daemon:start', async (_event) => {
    try {
      startBackgroundMonitorDaemon(broadcasterCallback);
      return { ok: true, message: 'Daemon started' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Stop daemon
  ipcMain.handle('daemon:stop', async (_event) => {
    try {
      stopBackgroundMonitorDaemon();
      return { ok: true, message: 'Daemon stopped' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Get daemon status
  ipcMain.handle('daemon:status', async (_event) => {
    try {
      const running = isDaemonRunning();
      const cache = getConvictionCache();
      const alerts = getAlertLog();

      return {
        ok: true,
        running,
        lastUpdate: cache.timestamp,
        convictionCount: Object.keys(cache.convictions || {}).length,
        recentAlerts: alerts.slice(-5),
        alertCount: alerts.length,
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Get conviction cache
  ipcMain.handle('daemon:getCache', async (_event) => {
    try {
      const cache = getConvictionCache();
      return { ok: true, cache };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Get alert history
  ipcMain.handle('daemon:getAlerts', async (_event, limit = 20) => {
    try {
      const alerts = getAlertLog();
      return { ok: true, alerts: alerts.slice(-limit) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Daemon Control handler registered (daemon:*) ✓');
}
