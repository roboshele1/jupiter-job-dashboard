/**
 * bootstrap.js
 * Central IPC registration hub
 */

import { registerPriceBridge } from "./priceBridge.js";
import { registerRiskCentreLiveIpc } from "./riskCentreLiveIpc.js";

export function bootstrapIPC() {
  registerPriceBridge();
  registerRiskCentreLiveIpc();
}
