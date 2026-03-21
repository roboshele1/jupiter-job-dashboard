/**
 * electron/ipc/holdingsIpc.js
 * Serves holdings data from holdings.json to renderer
 */

import { ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to holdings.json
const HOLDINGS_PATH = path.join(__dirname, "../../engine/data/users/default/holdings.json");

export function registerHoldingsIpc() {
  ipcMain.handle("holdings:get-all", async () => {
    try {
      const raw = fs.readFileSync(HOLDINGS_PATH, "utf-8");
      const holdings = JSON.parse(raw);
      return holdings;
    } catch (err) {
      console.error("[HOLDINGS IPC] Failed to read holdings.json:", err);
      return [];
    }
  });

  console.log("[IPC] Holdings handler registered");
}
