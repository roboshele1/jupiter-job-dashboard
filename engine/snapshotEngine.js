import fs from "fs";
import path from "path";
import { app } from "electron";

function getSnapshotDir() {
  const dir = path.join(app.getPath("userData"), "snapshots");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function saveTodaySnapshot(snapshot) {
  const dir = getSnapshotDir();
  const file = path.join(dir, `${getTodayKey()}.json`);

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          ...snapshot,
        },
        null,
        2
      )
    );
  }
}

export function loadPreviousSnapshot() {
  const dir = getSnapshotDir();
  const files = fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .sort();

  if (files.length < 2) return null;

  const prevFile = files[files.length - 2];
  const raw = fs.readFileSync(path.join(dir, prevFile));
  return JSON.parse(raw);
}

