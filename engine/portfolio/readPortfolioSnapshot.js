// engine/portfolio/readPortfolioSnapshot.js

import fs from "fs/promises";
import path from "path";

const SNAPSHOT_FILE = path.resolve(
  process.cwd(),
  "engine/portfolio/snapshots/latest.json"
);

export async function readPortfolioSnapshot() {
  try {
    const raw = await fs.readFile(SNAPSHOT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

