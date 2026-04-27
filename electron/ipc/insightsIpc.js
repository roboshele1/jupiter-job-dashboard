// electron/ipc/insightsIpc.js
// Insights decision ledger recording

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = '/Users/theadoos/JUPITER/snapshots/decision_ledger.json';

function loadLedger() {
  try {
    const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLedger(entries) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries, null, 2), 'utf-8');
}

export function registerInsightsIpc(ipcMain) {
  ipcMain.handle('insights:record', async (_event, payload) => {
    try {
      const ledger = loadLedger();
      const entry = {
        timestamp: payload.timestamp || Date.now(),
        type: payload.type || 'unknown',
        data: payload.data || {},
      };
      ledger.push(entry);
      saveLedger(ledger);
      return { ok: true, entryCount: ledger.length };
    } catch (err) {
      console.error('[insights:record] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Insights handler registered (insights:record) ✓');

  ipcMain.handle('ledger:getHistory', async () => {
    try {
      const ledger = loadLedger();
      const entries = ledger
        .filter(e => e.portfolioValue && e.timestamp)
        .map(e => ({
          timestamp: typeof e.timestamp === 'number'
            ? new Date(e.timestamp).toISOString()
            : e.timestamp,
          portfolioValue: Number(e.portfolioValue),
        }));
      return { ok: true, data: entries };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Insights handler registered (ledger:getHistory) ✓');

  ipcMain.handle('ledger:snapshotValue', async (_event, payload) => {
    try {
      const ledger = loadLedger();
      // Only snapshot once per day — check last entry date
      const today = new Date().toISOString().slice(0, 10);
      const lastEntry = ledger[ledger.length - 1];
      const lastDate = lastEntry?.timestamp?.slice(0, 10);
      if (lastDate === today) return { ok: true, skipped: true };
      ledger.push({
        id: 'SNAPSHOT_' + Date.now(),
        timestamp: payload.timestamp || new Date().toISOString(),
        type: 'DAILY_SNAPSHOT',
        portfolioValue: Number(payload.portfolioValue),
        holdingCount: payload.holdingCount || 0,
      });
      fs.writeFileSync('/Users/theadoos/JUPITER/snapshots/decision_ledger.json', JSON.stringify(ledger, null, 2), 'utf-8');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Insights handler registered (ledger:snapshotValue) ✓');


}
