"use strict";

const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname);

function writeSnapshot(snapshot) {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  const file = path.join(
    SNAPSHOT_DIR,
    `snapshot_${Date.now()}.json`
  );

  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
  return file;
}

module.exports = { writeSnapshot };

