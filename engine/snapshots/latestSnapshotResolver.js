"use strict";

/**
 * LATEST SNAPSHOT RESOLVER
 * ------------------------
 * Canonical authority for resolving newest portfolio snapshot.
 *
 * Rules:
 * - Read-only
 * - Deterministic
 * - No mutation
 * - No snapshot creation
 */

const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname);

function getLatestSnapshotName() {
  const files = fs.readdirSync(SNAPSHOT_DIR);

  const snapshotFiles = files
    .filter(f => f.startsWith("snapshot_") && f.endsWith(".json"))
    .map(f => ({
      name: f.replace(".json", ""),
      timestamp: parseInt(f.split("_")[1], 10)
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (!snapshotFiles.length) return null;

  return snapshotFiles[0].name;
}

function loadLatestSnapshot() {
  const latestName = getLatestSnapshotName();
  if (!latestName) return null;

  const filePath = path.join(SNAPSHOT_DIR, `${latestName}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = {
  loadLatestSnapshot,
  getLatestSnapshotName
};
