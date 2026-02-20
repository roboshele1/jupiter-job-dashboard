// engine/learning/jupiterMemory.js
// JUPITER MEMORY LAYER — Persistent Decision Intelligence
// Wires LCPE executions, regime states, and Jupiter AI interactions
// into the decision_ledger.json so Jupiter learns over time.
//
// This is the single authoritative write path for all learning events.
// Everything else in engine/learning/ was in-memory only — this persists.

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = path.resolve(__dirname, '../../snapshots/decision_ledger.json');
const MAX_ENTRIES = 10000; // cap to prevent unbounded growth

// ─── ENSURE LEDGER EXISTS ─────────────────────────────────────────────────────
function ensureLedger() {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify([], null, 2));
  }
}

function readLedger() {
  ensureLedger();
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeLedger(entries) {
  // Keep only the last MAX_ENTRIES to prevent unbounded growth
  const trimmed = entries.slice(-MAX_ENTRIES);
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(trimmed, null, 2));
}

// ─── CORE WRITE ───────────────────────────────────────────────────────────────
function record(event) {
  const ledger = readLedger();
  ledger.push({
    id:        `${event.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...event,
  });
  writeLedger(ledger);
}

// ─── EVENT TYPES ─────────────────────────────────────────────────────────────

// Called when user marks a position as executed in LCPE tracker
export function recordLCPEExecution({ symbol, amount, rank, cesScore, cagr, regime, kellyFrac }) {
  record({
    type:     'LCPE_EXECUTION',
    symbol,
    amount,
    rank,
    cesScore,
    cagr,
    regime,
    kellyFrac,
  });
}

// Called when LCPE runs — logs the full ranking snapshot
export function recordLCPERanking({ ranked, regime, portfolioValue, requiredCAGR }) {
  record({
    type:          'LCPE_RANKING',
    regime,
    portfolioValue,
    requiredCAGR,
    topPick:       ranked?.[0]?.symbol || null,
    topCES:        ranked?.[0]?.score  || null,
    rankSnapshot:  (ranked || []).slice(0, 5).map(r => ({
      symbol:    r.symbol,
      score:     r.score,
      cagr:      r.cagr,
      kellyFrac: r.kellyFrac,
      drift:     r.drift,
    })),
  });
}

// Called when regime changes
export function recordRegimeShift({ from, to, vix, trigger }) {
  record({
    type:    'REGIME_SHIFT',
    from,
    to,
    vix,
    trigger,
  });
}

// Called when Jupiter AI answers a question
export function recordAIInteraction({ question, responseLength, regime, portfolioValue, holdings }) {
  record({
    type:           'AI_INTERACTION',
    question,
    responseLength,
    regime,
    portfolioValue,
    holdingCount:   holdings || 0,
  });
}

// Called on app startup — tracks portfolio value over time
export function recordPortfolioSnapshot({ portfolioValue, positions, regime }) {
  record({
    type:          'PORTFOLIO_SNAPSHOT',
    portfolioValue,
    regime,
    holdingCount:  positions?.length || 0,
    positions:     (positions || []).map(p => ({
      symbol:    p.symbol,
      liveValue: p.liveValue,
      weight:    portfolioValue ? ((p.liveValue / portfolioValue) * 100).toFixed(1) : null,
    })),
  });
}

// ─── QUERY / READ ─────────────────────────────────────────────────────────────

export function getAllEvents() {
  return readLedger();
}

export function getEventsByType(type) {
  return readLedger().filter(e => e.type === type);
}

export function getRecentEvents(n = 50) {
  const ledger = readLedger();
  return ledger.slice(-n);
}

// Returns a memory summary Jupiter AI can inject into its system prompt
export function getMemorySummary() {
  const ledger = readLedger();
  if (!ledger.length) return null;

  const executions = ledger.filter(e => e.type === 'LCPE_EXECUTION');
  const snapshots  = ledger.filter(e => e.type === 'PORTFOLIO_SNAPSHOT');
  const regimes    = ledger.filter(e => e.type === 'REGIME_SHIFT');
  const aiChats    = ledger.filter(e => e.type === 'AI_INTERACTION');

  // Most executed symbols
  const execCounts = {};
  for (const e of executions) {
    execCounts[e.symbol] = (execCounts[e.symbol] || 0) + 1;
  }
  const topExecuted = Object.entries(execCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([symbol, count]) => `${symbol}(${count}x)`);

  // Portfolio value trajectory
  const firstSnap = snapshots[0];
  const lastSnap  = snapshots[snapshots.length - 1];
  const growth    = firstSnap && lastSnap && firstSnap.portfolioValue
    ? (((lastSnap.portfolioValue - firstSnap.portfolioValue) / firstSnap.portfolioValue) * 100).toFixed(1)
    : null;

  // Last regime
  const lastRegime = regimes[regimes.length - 1];

  return {
    totalDecisions:   ledger.length,
    executionCount:   executions.length,
    topExecuted,
    portfolioGrowth:  growth ? `${growth}%` : null,
    firstSeen:        firstSnap?.timestamp || null,
    lastSeen:         lastSnap?.timestamp  || null,
    lastRegimeShift:  lastRegime ? `${lastRegime.from} → ${lastRegime.to}` : null,
    aiInteractions:   aiChats.length,
    recentQuestions:  aiChats.slice(-3).map(a => a.question),
  };
}
