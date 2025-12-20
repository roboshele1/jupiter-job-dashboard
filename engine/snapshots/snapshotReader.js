const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = path.join(__dirname);

function readSnapshot(name) {
  const filePath = path.join(SNAPSHOT_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

module.exports = {
  readSnapshot,
};

