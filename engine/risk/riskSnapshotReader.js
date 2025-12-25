// engine/risk/riskSnapshotReader.js

import fs from "fs/promises";
import path from "path";

const SNAPSHOT_FILE = path.resolve(
  process.cwd(),
  "engine/risk/latestRiskSnapshot.json"
);

/**
 * Canonical reader for latest risk snapshot
 * Engine-only, read-only
 */
export async function readLatestRiskSnapshot() {
  try {
    const raw = await fs.readFile(SNAPSHOT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      contract: "RISK_SNAPSHOT_V1",
      status: "NO_SNAPSHOT",
      metrics: {},
    };
  }
}

