// electron/ipc/signalsIpc.js
import { buildSignalsSnapshot } from '../../engine/signals/signalsEngine.js';

let pinnedSnapshot = null;

export function registerSignalsIpc(ipcMain, getPortfolioSnapshot) {
  ipcMain.handle('signals:getSnapshot', async () => {
    // 🔒 IPC-LEVEL SESSION PIN
    if (pinnedSnapshot) {
      return pinnedSnapshot;
    }

    const portfolioSnap = await getPortfolioSnapshot();

    pinnedSnapshot = buildSignalsSnapshot({
      portfolio: portfolioSnap?.portfolio,
      confidence: portfolioSnap?.confidence
    });

    return pinnedSnapshot;
  });

  // Manual reset hook (safe, unused by UI)
  ipcMain.handle('signals:resetSnapshot', async () => {
    pinnedSnapshot = null;
    return { ok: true };
  });
}

