import fs from "fs";
import path from "path";

const SNAPSHOT_PATH = path.resolve(
  process.cwd(),
  "engine/portfolio/portfolio.snapshot.json"
);

export function readPortfolioSnapshot() {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      return null;
    }

    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[SnapshotReader] Failed to read portfolio snapshot", err);
    return null;
  }
}

