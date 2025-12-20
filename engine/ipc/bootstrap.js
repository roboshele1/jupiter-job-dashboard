/**
 * bootstrap.js
 * Central IPC registration hub
 */

import { registerPriceBridge } from "./priceBridge.js";

export function bootstrapIPC() {
  registerPriceBridge();
}

