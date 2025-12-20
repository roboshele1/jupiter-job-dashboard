// engine/learning/decisionLedger.js
import fs from 'fs';
import path from 'path';

const LEDGER_PATH = path.resolve('engine/snapshots/decision_ledger.json');

function ensureLedger() {
  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify([] , null, 2));
  }
}

export function recordDecision(event) {
  ensureLedger();
  const data = JSON.parse(fs.readFileSync(LEDGER_PATH));
  data.push({
    ...event,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2));
}

export function getDecisions() {
  ensureLedger();
  return JSON.parse(fs.readFileSync(LEDGER_PATH));
}

