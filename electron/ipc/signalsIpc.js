// electron/ipc/signalsIpc.js
// Signals IPC — authoritative snapshot bridge
// Deterministic, read-only, pinned per session

import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';
import snapshotEngine from '../../engine/signalsSnapshotEngine.js';

const { recordSnapshot } = snapshotEngine;

let pinnedSnapshot = null;

export function registerSignalsIpc(ipcMain, getPortfolioSnapshot) {
  ipcMain.handle('signals:getSnapshot', async () => {
    // 🔒 IPC-LEVEL SESSION PIN
    if (pinnedSnapshot) {
      return pinnedSnapshot;
    }

    const portfolioSnap = await getPortfolioSnapshot();

    const rawSnapshot = buildSignalsSnapshot({
      portfolio: portfolioSnap?.portfolio,
      confidenceEvaluations: portfolioSnap?.confidenceEvaluations || []
    });

    pinnedSnapshot = recordSnapshot(rawSnapshot);
    return pinnedSnapshot;
  });

  // Manual reset hook (safe, unused by UI)
  ipcMain.handle('signals:resetSnapshot', async () => {
    pinnedSnapshot = null;
    return { ok: true };
  });
}
