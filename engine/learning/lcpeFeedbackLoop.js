// engine/learning/lcpeFeedbackLoop.js
// JUPITER — LCPE Feedback Loop
// Records every LCPE execution with entry price + CES score.
// On app launch, scores any execution that hit a 30/60/90 day checkpoint
// by fetching current price and comparing to entry price.
// Writes outcome back to decision_ledger.json automatically.

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH  = path.resolve(__dirname, '../../snapshots/decision_ledger.json');
const CHECKPOINTS  = [30, 60, 90]; // days

// ─── LEDGER HELPERS ──────────────────────────────────────────────────────────
function readLedger() {
  try {
    if (!fs.existsSync(LEDGER_PATH)) return [];
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch { return []; }
}

function writeLedger(entries) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries.slice(-10000), null, 2));
}

// ─── RECORD EXECUTION ────────────────────────────────────────────────────────
// Called from IPC when user taps ✓ on an LCPE chip.
// Stores entry price, CES score, CAGR, regime, and amount.
export function recordLCPEExecution({ symbol, amount, rank, cesScore, cagr, regime, kellyFrac, entryPrice }) {
  const ledger = readLedger();
  ledger.push({
    id:         `LCPE_EXEC_${Date.now()}_${symbol}`,
    type:       'LCPE_EXECUTION',
    timestamp:  new Date().toISOString(),
    symbol,
    amount:     Number(amount) || 0,
    rank:       Number(rank)   || 0,
    cesScore:   Number(cesScore) || 0,
    cagr:       Number(cagr)   || 0,
    regime:     regime || 'NEUTRAL',
    kellyFrac:  Number(kellyFrac) || 0,
    entryPrice: Number(entryPrice) || 0,
    outcomes:   {},   // populated by scorer: { "30": { price, return, scoredAt }, ... }
    fullyScored: false,
  });
  writeLedger(ledger);
}

// ─── SCORE PENDING EXECUTIONS ────────────────────────────────────────────────
// Called on app launch via IPC.
// For each unscored execution, checks if 30/60/90 day checkpoints have passed.
// Fetches current price from Polygon and writes the return outcome.
export async function scorePendingExecutions(polygonApiKey) {
  if (!polygonApiKey) return { scored: 0, skipped: 0 };

  const ledger     = readLedger();
  const executions = ledger.filter(e => e.type === 'LCPE_EXECUTION' && !e.fullyScored && e.entryPrice > 0);

  if (!executions.length) return { scored: 0, skipped: executions.length };

  let scoredCount = 0;
  const now = Date.now();

  for (const exec of executions) {
    const execTime   = new Date(exec.timestamp).getTime();
    const daysElapsed = (now - execTime) / (1000 * 60 * 60 * 24);
    let changed = false;

    for (const checkpoint of CHECKPOINTS) {
      // Already scored this checkpoint
      if (exec.outcomes[String(checkpoint)]) continue;
      // Checkpoint not reached yet
      if (daysElapsed < checkpoint) continue;

      // Fetch current price
      const price = await fetchPrice(exec.symbol, polygonApiKey);
      if (!price) continue;

      const returnPct = ((price - exec.entryPrice) / exec.entryPrice) * 100;

      exec.outcomes[String(checkpoint)] = {
        price:     price,
        returnPct: parseFloat(returnPct.toFixed(2)),
        scoredAt:  new Date().toISOString(),
        verdict:   returnPct >= 5 ? 'WIN' : returnPct <= -5 ? 'LOSS' : 'NEUTRAL',
      };

      changed = true;
      scoredCount++;
    }

    // Mark fully scored once all 3 checkpoints are done
    if (Object.keys(exec.outcomes).length === CHECKPOINTS.length) {
      exec.fullyScored = true;
    }

    // Write back to ledger entry
    if (changed) {
      const idx = ledger.findIndex(e => e.id === exec.id);
      if (idx !== -1) ledger[idx] = exec;
    }
  }

  if (scoredCount > 0) writeLedger(ledger);
  return { scored: scoredCount, skipped: executions.length - scoredCount };
}

// ─── GET FEEDBACK SUMMARY ────────────────────────────────────────────────────
// Returns a structured summary of how LCPE recommendations performed.
// Used by Jupiter AI memory and a future Feedback tab.
export function getLCPEFeedbackSummary() {
  const ledger     = readLedger();
  const executions = ledger.filter(e => e.type === 'LCPE_EXECUTION');

  if (!executions.length) return null;

  const results = [];

  for (const exec of executions) {
    for (const [days, outcome] of Object.entries(exec.outcomes || {})) {
      results.push({
        symbol:    exec.symbol,
        days:      Number(days),
        returnPct: outcome.returnPct,
        verdict:   outcome.verdict,
        regime:    exec.regime,
        cesScore:  exec.cesScore,
        cagr:      exec.cagr,
        rank:      exec.rank,
        executedAt: exec.timestamp,
      });
    }
  }

  if (!results.length) return { executions: executions.length, outcomes: 0 };

  const wins    = results.filter(r => r.verdict === 'WIN').length;
  const losses  = results.filter(r => r.verdict === 'LOSS').length;
  const neutral = results.filter(r => r.verdict === 'NEUTRAL').length;
  const avgReturn = results.reduce((s, r) => s + r.returnPct, 0) / results.length;

  // Best and worst calls
  const sorted  = [...results].sort((a, b) => b.returnPct - a.returnPct);
  const bestCall  = sorted[0]  || null;
  const worstCall = sorted[sorted.length - 1] || null;

  // Win rate by regime
  const regimeStats = {};
  for (const r of results) {
    if (!regimeStats[r.regime]) regimeStats[r.regime] = { wins: 0, total: 0 };
    regimeStats[r.regime].total++;
    if (r.verdict === 'WIN') regimeStats[r.regime].wins++;
  }

  return {
    executions:  executions.length,
    outcomes:    results.length,
    winRate:     parseFloat(((wins / results.length) * 100).toFixed(1)),
    avgReturn:   parseFloat(avgReturn.toFixed(2)),
    wins, losses, neutral,
    bestCall:    bestCall  ? `${bestCall.symbol} +${bestCall.returnPct}% at ${bestCall.days}d` : null,
    worstCall:   worstCall ? `${worstCall.symbol} ${worstCall.returnPct}% at ${worstCall.days}d` : null,
    regimeStats,
    pendingScoring: executions.filter(e => !e.fullyScored).length,
  };
}

// ─── PRICE FETCHER ───────────────────────────────────────────────────────────
async function fetchPrice(symbol, apiKey) {
  try {
    // Crypto
    if (['BTC', 'ETH', 'WBTC'].includes(symbol.toUpperCase())) {
      const coinMap = { BTC: 'bitcoin', ETH: 'ethereum', WBTC: 'wrapped-bitcoin' };
      const id = coinMap[symbol.toUpperCase()];
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const json = await res.json();
      return json[id]?.usd || null;
    }
    // Equity via Polygon prev close
    const res  = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`);
    const json = await res.json();
    return json.results?.[0]?.c || null;
  } catch {
    return null;
  }
}
