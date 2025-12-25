// engine/portfolio/portfolioSnapshotWriter.js

import fs from "fs/promises";
import path from "path";

const SNAPSHOT_DIR = path.resolve(process.cwd(), "engine/portfolio/snapshots");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "latest.json");

export async function writePortfolioSnapshot(valuation) {
  if (!valuation || !valuation.contract) {
    throw new Error("Invalid valuation payload");
  }

  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

  const snapshot = {
    ...valuation,
    _asOf: Date.now()
  };

  await fs.writeFile(
    SNAPSHOT_FILE,
    JSON.stringify(snapshot, null, 2),
    "utf-8"
  );

  return SNAPSHOT_FILE;
}

