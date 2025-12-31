import { registerGrowthEngineIpc } from "./growthEngineIpc.js";

export function registerAllIpc(ipcMain) {
  registerGrowthEngineIpc(ipcMain);
}

