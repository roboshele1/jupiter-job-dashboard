"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_DIR = path.join(process.cwd(), "engine", "snapshots");
const DEFAULT_LEDGER_FILE = "ledger.ndjson";

/**
 * Append-only NDJSON store.
 * One JSON object per line.
 */
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ledgerPath(dirPath, fileName) {
  return path.join(dirPath, fileName);
}

/**
 * @param {Object} opts
 * @param {string} [opts.dirPath] - directory for ledger
 * @param {string} [opts.fileName] - ledger file name
 */
function createEventStore(opts = {}) {
  const dirPath = opts.dirPath || DEFAULT_DIR;
  const fileName = opts.fileName || DEFAULT_LEDGER_FILE;

  ensureDir(dirPath);

  return {
    dirPath,
    fileName,
    filePath: ledgerPath(dirPath, fileName),

    appendLine(line) {
      fs.appendFileSync(this.filePath, line + "\n", { encoding: "utf8" });
    },

    appendJson(obj) {
      const line = JSON.stringify(obj);
      this.appendLine(line);
    },

    readTail(maxLines = 200) {
      if (!fs.existsSync(this.filePath)) return [];
      const raw = fs.readFileSync(this.filePath, "utf8");
      const lines = raw.split("\n").filter(Boolean);
      return lines.slice(Math.max(0, lines.length - maxLines)).map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      }).filter(Boolean);
    },
  };
}

module.exports = {
  createEventStore,
};

