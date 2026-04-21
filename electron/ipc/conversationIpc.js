import fs from "fs";
import path from "path";
import { ipcMain } from "electron";

const ALERT_PATH = path.join(process.cwd(), "data", "jupiterAlert.json");

const CONVO_PATH = path.join(process.cwd(), "data", "jupiterConversation.json");

export function registerConversationIpc() {
  ipcMain.handle("conversation:load", async () => {
    try {
      if (!fs.existsSync(CONVO_PATH)) return [];
      const raw = fs.readFileSync(CONVO_PATH, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  ipcMain.handle("conversation:save", async (_e, messages) => {
    try {
      const trimmed = Array.isArray(messages) ? messages.slice(-40) : [];
      fs.writeFileSync(CONVO_PATH, JSON.stringify(trimmed, null, 2), "utf8");
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle("conversation:clear", async () => {
    try {
      fs.writeFileSync(CONVO_PATH, "[]", "utf8");
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle("conversation:saveAlert", async (_e, alert) => {
    try {
      fs.writeFileSync(ALERT_PATH, alert ? JSON.stringify(alert) : "null", "utf8");
      return true;
    } catch { return false; }
  });

  ipcMain.handle("conversation:loadAlert", async () => {
    try {
      if (!fs.existsSync(ALERT_PATH)) return null;
      const raw = fs.readFileSync(ALERT_PATH, "utf8");
      return JSON.parse(raw);
    } catch { return null; }
  });
}
