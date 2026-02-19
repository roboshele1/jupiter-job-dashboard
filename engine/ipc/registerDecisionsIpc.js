// engine/ipc/registerDecisionsIpc.js
// Append-only: Decisions IPC registration — ready for Electron runtime

import electron from 'electron';
const { ipcMain } = electron;

// Correct relative path from engine/ipc/ to electron/ipc/systemStateIpc.js
import { getSystemState } from '../../electron/ipc/systemStateIpc.js';

/**
 * Registers Decisions IPC channel.
 * Read-only: fetches from systemState intelligence context.
 */
export function registerDecisionsIpc() {
  // Avoid double registration
  if (ipcMain.listenerCount('decisions:get') > 0) return;

  ipcMain.handle('decisions:get', async () => {
    try {
      const state = await getSystemState();
      return state.holdings.map(h => ({
        symbol: h.symbol,
        quantity: h.quantity,
        liveValue: h.liveValue,
        book: h.book,
        delta: h.delta,
        deltaPct: h.deltaPct,
        technicals: h.technicals,
        conviction: h.conviction || {}
      }));
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
      return [];
    }
  });
}
