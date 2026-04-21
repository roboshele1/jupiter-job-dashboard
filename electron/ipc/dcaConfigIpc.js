import fs from "fs";
import path from "path";
import { ipcMain } from "electron";

const CONFIG_PATH = path.join(process.cwd(), "data", "dcaConfig.json");

const DEFAULT_CONFIG = {
  bucketA: [
    { symbol: "PLTR", pct: 0.40, active: true },
    { symbol: "RKLB", pct: 0.35, active: true },
    { symbol: "APP",  pct: 0.25, active: true },
  ],
  bucketB: [
    { symbol: "AXON", pct: 0.40, active: true },
    { symbol: "NU",   pct: 0.30, active: true },
    { symbol: "MELI", pct: 0.30, active: true },
  ],
  bucketASplit: 0.40,
};

export function registerDcaConfigIpc() {
  ipcMain.handle("dca:config:get", async () => {
    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
        return DEFAULT_CONFIG;
      }
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch { return DEFAULT_CONFIG; }
  });

  ipcMain.handle("dca:config:save", async (_e, config) => {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
      return true;
    } catch { return false; }
  });
}
