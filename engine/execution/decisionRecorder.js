import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.resolve(__dirname, '../../snapshots/decision_ledger.json');

function readLedger() {
  try { return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')); }
  catch { return []; }
}

function writeLedger(entries) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries.slice(-10000), null, 2));
}

export function recordExecution(symbol, entryPrice, kellySize, thesisType, conviction) {
  const ledger = readLedger();
  ledger.push({
    id: `EXEC_${Date.now()}_${symbol}`,
    type: 'EXECUTION',
    timestamp: new Date().toISOString(),
    symbol,
    entryPrice: Number(entryPrice),
    kellySize: Number(kellySize),
    thesisType,
    conviction: Number(conviction),
    status: 'PENDING',
    outcomes: {}
  });
  writeLedger(ledger);
  return ledger[ledger.length - 1];
}

export function recordOutcome(executionId, currentPrice, daysElapsed) {
  const ledger = readLedger();
  const exec = ledger.find(e => e.id === executionId);
  if (!exec) return null;
  
  const returnPct = ((currentPrice - exec.entryPrice) / exec.entryPrice) * 100;
  const verdict = returnPct >= 5 ? 'WIN' : returnPct <= -5 ? 'LOSS' : 'NEUTRAL';
  
  exec.outcomes[daysElapsed] = {
    currentPrice: Number(currentPrice),
    returnPct: returnPct.toFixed(2),
    verdict,
    recordedAt: new Date().toISOString()
  };
  
  writeLedger(ledger);
  return exec;
}

export function getThesisAccuracy(thesisType) {
  const ledger = readLedger();
  const byThesis = ledger.filter(e => e.thesisType === thesisType && Object.keys(e.outcomes).length > 0);
  
  if (byThesis.length === 0) return 0;
  
  const wins = byThesis.filter(e => Object.values(e.outcomes).some(o => o.verdict === 'WIN')).length;
  return (wins / byThesis.length) * 100;
}
