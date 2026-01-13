// electron/ipc/signalsV2Ipc.js
// Signals V2 IPC — Growth + Risk + Confidence aware
// Append-only. Deterministic. Read-only.
// No UI assumptions.

import { buildSignalsV2Snapshot } from "../../engine/signals/signalsV2Engine.js";
import snapshotEngine from "../../engine/signalsSnapshotEngine.js";

const { recordSnapshot } = snapshotEngine;

let pinnedSnapshotV2 = null;

export function registerSignalsV2Ipc(ipcMain, getAuthoritativeSnapshot) {
  ipcMain.handle("signals:v2:getSnapshot", async () => {
    // 🔒 Session pin (same philosophy as Signals V1)
    if (pinnedSnapshotV2) {
      return pinnedSnapshotV2;
    }

    const snapshot = await getAuthoritativeSnapshot();

    const portfolioSnapshot = snapshot?.portfolio;
    if (!portfolioSnapshot) {
      throw new Error("SIGNALS_V2_NO_PORTFOLIO");
    }

    // Optional surfaces (graceful if missing)
    const growthTrajectory = snapshot?.growthTrajectory || null;
    const riskSnapshot = snapshot?.risk || null;
    const confidenceEvaluations = snapshot?.confidenceEvaluations || [];

    const raw = buildSignalsV2Snapshot({
      portfolioSnapshot,
      growthTrajectory,
      riskSnapshot,
      confidenceEvaluations
    });

    pinnedSnapshotV2 = recordSnapshot(raw);
    return pinnedSnapshotV2;
  });

  // Manual reset hook (unused by UI, safe for testing)
  ipcMain.handle("signals:v2:resetSnapshot", async () => {
    pinnedSnapshotV2 = null;
    return { ok: true };
  });
}
