// electron/ipc/systemStateIpc.js
// System State IPC — deterministic intelligence surface

import { buildAwarenessState } from "../../engine/intelligence/awarenessEngine.js";
import { interpretDecisionState } from "../../engine/intelligence/decisionInterpreter.js";
import { assembleSignalsContext } from "../../engine/intelligence/signalInterface.js";
import { normalizeRiskSnapshot } from "../../engine/risk/index.js";
import { assembleIntelligenceContext } from "../../engine/intelligence/contextAssembler.js";
import { interpretConviction } from "../../engine/intelligence/convictionInterpreter.js";

/* ASSET SYSTEM STATE ENGINE */
import { buildAssetSystemStateV1 } from "../../engine/systemState/assetSystemStateEngine.v1.js";

function registerHandler(ipcMain, channel, fn) {
  try { ipcMain.removeHandler(channel); } catch {}
  ipcMain.handle(channel, fn);
}

export function registerSystemStateIpc(ipcMain) {
  registerHandler(ipcMain, "system:getState", async () => {

    const awareness = await buildAwarenessState();
    const decision = await interpretDecisionState();
    const signals = await assembleSignalsContext();

    const ctx = await assembleIntelligenceContext();
    const risk = normalizeRiskSnapshot({
      positions: ctx.positions,
      totals: ctx.totals
    });

    /* ENGINE COMPUTE — ASSET SYSTEM STATE */
    const v1Portfolio = ctx?.totals ?? {};

    const assetSystemState = buildAssetSystemStateV1({
      holdings: ctx?.positions ?? [],
      signalsBySymbol: signals?.signalsV1 ?? {},
      portfolioContext: {
        nowValue: v1Portfolio.totalValue ?? null,
        goalValue: 1000000,
        yearsRemaining: Math.max(0, 2037 - new Date().getFullYear())
      }
    });

    /* READ-ONLY — CONVICTION INTERPRETER */
    const convictionState = interpretConviction({
      systemState: { awareness, decision, signals, risk, assetSystemState },
      positions: ctx?.positions ?? []
    });

    return Object.freeze({
      timestamp: Date.now(),
      awareness,
      decision,
      signals,
      risk,
      assetSystemState,
      convictionState
    });
  });
}

export async function getSystemState() {
  return {};
}
