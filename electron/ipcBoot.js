/**
 * ipcBoot.js
 * Central IPC registrar
 */

import { registerPriceBridge } from "../engine/ipc/priceBridge.js";

export function initIPC() {
  registerPriceBridge();
}

