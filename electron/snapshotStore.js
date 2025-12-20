import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_PATH = path.join(__dirname, "snapshot.json");

export function loadSnapshot() {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) return null;
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot) {
  try {
    fs.writeFileSync(
      SNAPSHOT_PATH,
      JSON.stringify(snapshot, null, 2),
      "utf-8"
    );
  } catch {}
}

