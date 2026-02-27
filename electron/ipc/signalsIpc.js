// electron/ipc/signalsIpc.js
// Signals IPC — authoritative snapshot bridge
// Deterministic, read-only, pinned per session with 5-min TTL

import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import snapshotEngine from '../../engine/signalsSnapshotEngine.js';

const { recordSnapshot } = snapshotEngine;

let pinnedSnapshot = null;
let snapshotTimestamp = null;
const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isSnapshotStale() {
  if (!pinnedSnapshot || !snapshotTimestamp) return true;
  return Date.now() - snapshotTimestamp > SNAPSHOT_TTL_MS;
}

export function registerSignalsIpc(ipcMain, getPortfolioSnapshot) {
  ipcMain.handle('signals:getSnapshot', async () => {
    // 🔒 IPC-LEVEL SESSION PIN with TTL
    if (pinnedSnapshot && !isSnapshotStale()) {
      return pinnedSnapshot;
    }

    // Snapshot expired or doesn't exist — rebuild
    pinnedSnapshot = null;
    snapshotTimestamp = null;

    const portfolioSnap = await getPortfolioSnapshot();

    const rawSnapshot = buildSignalsSnapshot({
      portfolio: portfolioSnap?.portfolio,
      confidenceEvaluations: portfolioSnap?.confidenceEvaluations || []
    });

    pinnedSnapshot = recordSnapshot(rawSnapshot);
    snapshotTimestamp = Date.now();
    return pinnedSnapshot;
  });

  // Manual reset hook (safe, unused by UI)
  ipcMain.handle('signals:resetSnapshot', async () => {
    pinnedSnapshot = null;
    snapshotTimestamp = null;
    return { ok: true };
  });
}
