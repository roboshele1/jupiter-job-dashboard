// renderer/insights/confidenceHistoryStore.js
// Append-only confidence history store (deterministic, local)

import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("data");
const FILE_PATH = path.join(DATA_DIR, "confidenceHistory.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "[]");
}

export function readConfidenceHistory() {
  ensureStore();
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
}

export function appendConfidenceSnapshot(confidenceBand) {
  ensureStore();

  const history = readConfidenceHistory();
  history.push({
    timestamp: Date.now(),
    confidenceBand
  });

  fs.writeFileSync(FILE_PATH, JSON.stringify(history, null, 2));
  return history;
}
