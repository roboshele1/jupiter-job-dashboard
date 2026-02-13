// electron/ipc/systemStateIpc.js
// System State IPC — deterministic intelligence surface
// Renderer calls: window.jupiter.invoke("system:getState")

import { buildAwarenessState } from "../../engine/intelligence/awarenessEngine.js";
import { interpretDecisionState } from "../../engine/intelligence/decisionInterpreter.js";
import { assembleSignalsContext } from "../../engine/intelligence/signalInterface.js";
import { normalizeRiskSnapshot } from "../../engine/risk/index.js";
import { assembleIntelligenceContext } from "../../engine/intelligence/contextAssembler.js";

function registerHandler(ipcMain, channel, fn) {
  try {
    ipcMain.removeHandler(channel);
  } catch {}
  ipcMain.handle(channel, fn);
}

export function registerSystemStateIpc(ipcMain) {
  registerHandler(ipcMain, "system:getState", async () => {
    // Awareness
    const awareness = await buildAwarenessState();

    // Decision posture
    const decision = await interpretDecisionState();

    // Signals
    const signals = await assembleSignalsContext();

    // Risk normalization
    const ctx = await assembleIntelligenceContext();
    const risk = normalizeRiskSnapshot({
      positions: ctx.positions,
      totals: ctx.totals
    });

    return Object.freeze({
      timestamp: Date.now(),
      awareness,
      decision,
      signals,
      risk
    });
  });
}
