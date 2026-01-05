/**
 * CHAT_V2_IPC
 * ===========
 * Phase 11 — Chat V2 IPC wiring (read-only)
 *
 * PURPOSE
 * -------
 * - Expose Chat V2 Orchestrator to the renderer
 * - Preserve engine authority
 * - Enforce governance at the IPC boundary
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No UI logic
 */

import { ipcMain } from "electron";
import { runChatV2Orchestrator } from "../../engine/chat/v2/orchestrator/chatV2Orchestrator.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_IPC_CONTRACT = {
  name: "CHAT_V2_IPC",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   IPC REGISTRATION
========================================================= */

export function registerChatV2Ipc() {
  ipcMain.handle("chat:v2:run", async (_event, payload = {}) => {
    const { query, intent, portfolioSnapshot = null, context = null, meta = {} } =
      payload;

    return runChatV2Orchestrator({
      query,
      intent,
      portfolioSnapshot,
      context,
      meta,
    });
  });
}
