import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.resolve(__dirname, '../../snapshots/decision_ledger.json');

function readLedger() {
  try { return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')); }
  catch { return []; }
}

export function getActualWinProbability(symbol, thesisType) {
  const ledger = readLedger();
  const executions = ledger.filter(e => 
    (e.symbol === symbol || e.thesisType === thesisType) && 
    Object.keys(e.outcomes).length > 0
  );
  
  if (executions.length === 0) return null; // No history
  
  const wins = executions.filter(e => 
    Object.values(e.outcomes).some(o => o.verdict === 'WIN')
  ).length;
  
  return wins / executions.length;
}

export function getActualPayoffRatio(symbol, thesisType) {
  const ledger = readLedger();
  const executions = ledger.filter(e => 
    (e.symbol === symbol || e.thesisType === thesisType) && 
    Object.keys(e.outcomes).length > 0
  );
  
  if (executions.length === 0) return null;
  
  const returns = executions.map(e => {
    const outcomes = Object.values(e.outcomes);
    const maxReturn = Math.max(...outcomes.map(o => parseFloat(o.returnPct)));
    return maxReturn;
  });
  
  const avgPayoff = returns.reduce((a, b) => a + b) / returns.length;
  return Math.max(1, avgPayoff / 100); // Convert % to ratio
}

export function calculateKellyFraction(winProbability, payoffRatio = 2) {
  const p = Number(winProbability);
  const b = Number(payoffRatio);
  
  if (p <= 0 || p >= 1 || b <= 0) return 0;
  
  const q = 1 - p;
  const rawKelly = (b * p - q) / b;
  
  if (rawKelly < 0) return 0;
  if (rawKelly > 0.25) return 0.25;
  return rawKelly;
}

export function scoreDecision(symbol, currentPrice, targetPrice, thesisType, liveConviction) {
  // Pull ACTUAL win probability from ledger
  const actualWinProb = getActualWinProbability(symbol, thesisType) || null;
  const actualPayoff = getActualPayoffRatio(symbol, thesisType) || null;
  
  // If no history, use live conviction as fallback (NOT hardcoded)
  const winProb = actualWinProb !== null ? actualWinProb : Math.max(0.3, Math.min(0.9, liveConviction));
  const payoffRatio = actualPayoff !== null ? actualPayoff : (targetPrice / currentPrice);
  
  const kelly = calculateKellyFraction(winProb, payoffRatio);
  const edge = (winProb * payoffRatio) - (1 - winProb);
  
  return {
    symbol,
    winProbability: (winProb * 100).toFixed(0) + '%',
    payoffRatio: payoffRatio.toFixed(2) + 'x',
    kelly: (kelly * 100).toFixed(2) + '%',
    halfKelly: ((kelly * 0.5) * 100).toFixed(2) + '%',
    quarterKelly: ((kelly * 0.25) * 100).toFixed(2) + '%',
    edge: (edge * 100).toFixed(2) + '%',
    conviction: (liveConviction * 100).toFixed(0) + '%',
    source: actualWinProb !== null ? 'HISTORICAL_DATA' : 'LIVE_CONVICTION',
  };
}
