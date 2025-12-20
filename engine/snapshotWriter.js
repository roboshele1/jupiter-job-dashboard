const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");

function writeSnapshot(snapshot) {
  const file = path.join(
    SNAPSHOT_DIR,
    `snapshot_${Date.now()}.json`
  );
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
}

module.exports = {
  writeSnapshot,
};

