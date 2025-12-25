// electron/ipc/dashboardIpc.js

import { ipcMain } from "electron";
import fs from "fs/promises";
import path from "path";

const SNAPSHOT_FILE = path.resolve(
  process.cwd(),
  "engine/portfolio/snapshots/latest.json"
);

export function registerDashboardIpc() {
  ipcMain.handle("dashboard:getSnapshot", async () => {
    try {
      const raw = await fs.readFile(SNAPSHOT_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
}

