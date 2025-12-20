import fs from "fs";
import path from "path";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "snapshot.json");

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
    fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  } catch {
    // fail silently — V1 must never crash
  }
}

