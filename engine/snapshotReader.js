const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");

function readLatestSnapshot() {
  if (!fs.existsSync(SNAPSHOT_DIR)) return null;

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith("snapshot_"))
    .sort();

  if (files.length === 0) return null;

  const latest = files[files.length - 1];
  return JSON.parse(
    fs.readFileSync(path.join(SNAPSHOT_DIR, latest), "utf-8")
  );
}

module.exports = {
  readLatestSnapshot,
};

