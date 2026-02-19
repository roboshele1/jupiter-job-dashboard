/**
 * Insights.jsx — Session 8
 * Features:
 *  1. Real CAGR table (not Kelly-derived)
 *  2. Auto-refresh every 60s + manual refresh button
 *  3. Regime-aware CAGR adjustment (RISK_OFF reduces assumed growth, RISK_ON increases)
 *  4. Monthly execution tracker — check off contributions, Jupiter remembers
 *  5. Executed positions move to "DONE THIS MONTH" section
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

const C = {
  bg: '#060910', surface: '#0c1220', panel: '#0f172a',
  border: '#1a2540', text: '#e2e8f0', textSec: '#94a3b8', textMuted: '#6b7280',
  green: '#22c55e', red: '#ef4444', blue: '#3b82f6',
  gold: '#f59e0b', cyan: '#06b6d4', teal: '#14b8a6', purple: '#a855f7',
};
const mono = { fontFamily: 'IBM Plex Mono' };

const GOAL            = 1_000_000;
const GOAL_YEAR       = 2037;
const DCA_DEFAULT     = 500;
const REFRESH_MS      = 60_000; // auto-refresh every 60 seconds
const HARD_CAP        = 30;
const KELLY_MULT      = 0.25;

const fmt    = (n, d = 1) => Number(n || 0).toFixed(d);
const fmtUSD = n => '$' + Math.abs(Number(n || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtPct = (n, d = 1) => Number(n || 0).toFixed(d) + '%';

// ─── Month key for execution tracker ─────────────────────────────────────────
// e.g. "2026-02" — resets the tracker automatically each new calendar month
function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Persistent execution store ───────────────────────────────────────────────
// Stored as: lcpe:executions:YYYY-MM → JSON array of { symbol, amount, executedAt }
const EXEC_STORE_KEY = () => `lcpe:executions:${monthKey()}`;

async function loadExecutions() {
  try {
    const result = await window.storage.get(EXEC_STORE_KEY());
    return result ? JSON.parse(result.value) : [];
  } catch { return []; }
}

async function saveExecutions(list) {
  try {
    await window.storage.set(EXEC_STORE_KEY(), JSON.stringify(list));
  } catch (e) { console.warn('LCPE storage write failed', e); }
}

// ─── REAL CAGR TABLE ─────────────────────────────────────────────────────────
// These are the ONLY numbers used for projections and CES scoring.
// Kelly win probability controls position SIZING only — never CAGR.
const BASE_CAGR = {
  CNSWF: 26, CSU:  26,   // Constellation Software ~25-28% 10yr
  NVDA:  35,             // 5yr blended, forward-moderated
  ASML:  22,             // 10yr litho monopoly compounder
  AVGO:  28,             // 5yr incl. VMware accretion
  NOW:   24,             // ServiceNow 5yr SaaS compounder
  MA:    18,             // Mastercard steady compounder
  HOOD:  20,             // Early stage fintech
  APLD:  22,             // AI infrastructure buildout
  BMNR:  15,             // Speculative, early revenue
  BTC:   30,             // Long-term cycle-adjusted
  ETH:   25,             // Conservative vs BTC
  MSTR:  28,             // BTC proxy + leverage premium
  WBTC:  30,             // Tracks BTC
  default: 15,
};

// Regime modifier: adjusts assumed CAGR based on current market conditions.
// Rationale: In RISK_OFF, forward growth expectations compress; in RISK_ON they expand.
// This makes LCPE ranking dynamic — not just a static table lookup.
const REGIME_MODIFIER = {
  RISK_ON:       +3,   // Add 3% to all CAGRs — bull market tailwind
  MILD_RISK_ON:  +1.5,
  NEUTRAL:        0,
  MILD_RISK_OFF: -2,
  RISK_OFF:      -5,   // Compress 5% — growth expectations shrink in fear
};

function getAssetCAGR(symbol, regime = 'NEUTRAL') {
  const base = BASE_CAGR[symbol?.toUpperCase()] ?? BASE_CAGR.default;
  const mod  = REGIME_MODIFIER[regime] ?? 0;
  return Math.max(5, base + mod);
}

// ─── LCPE MATH ────────────────────────────────────────────────────────────────
function geometricGrowth(cagrPct, volPct) {
  const r = cagrPct / 100, v = volPct / 100;
  return r - (v * v / 2);
}

function kellyFraction(winProb, winLoss) {
  if (!winProb || !winLoss || winLoss <= 0) return 0;
  return Math.max(0, (winLoss * winProb - (1 - winProb)) / winLoss);
}

function concPenalty(currentW, targetW, hardCap) {
  if (currentW >= hardCap) return Infinity;
  const excess = Math.max(0, currentW - targetW);
  return 1 + 0.08 * excess * excess;
}

function ces(cagrPct, volPct, winProb, winLoss, currentW, targetW) {
  if (currentW >= HARD_CAP) return -Infinity;
  const geo     = geometricGrowth(cagrPct, volPct);
  const kf      = kellyFraction(winProb, winLoss) * KELLY_MULT;
  const penalty = concPenalty(currentW, targetW, HARD_CAP);
  const mggi    = (geo * kf) / penalty;
  return mggi / Math.max(0.01, volPct / 100);
}

const VOL = {
  NVDA: 55, ASML: 35, AVGO: 40, MSTR: 90, HOOD: 75,
  BMNR: 95, APLD: 85, NOW: 35, BTC: 65, ETH: 75,
  CNSWF: 30, CSU: 30, MA: 22, default: 45,
};

const TARGET_W = {
  NVDA: 18, ASML: 15, AVGO: 15, BTC: 18, ETH: 8,
  MSTR: 8, HOOD: 6, NOW: 6, BMNR: 3, APLD: 3,
  CNSWF: 12, MA: 8, default: 5,
};

// ─── LCPE RUNNER ─────────────────────────────────────────────────────────────
function runLCPE(positions, kellyActions, portfolioValue, monthlyDCA, regime, executedSymbols) {
  if (!positions.length || !portfolioValue) return {
    ranked: [], blocked: [], executed: [], allocation: [],
    currentBlended: 0, requiredCAGR: 0,
  };

  const kellyMap = {};
  for (const a of kellyActions || []) {
    if (a.symbol) kellyMap[a.symbol] = a;
  }

  const yearsLeft    = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = (Math.pow(GOAL / portfolioValue, 1 / yearsLeft) - 1) * 100;
  const executedSet  = new Set(executedSymbols || []);

  const scored = positions.map(p => {
    const k        = kellyMap[p.symbol] || {};
    const cagr     = getAssetCAGR(p.symbol, regime);
    const vol      = VOL[p.symbol] || VOL.default;
    const winProb  = k.winProbability || 0.5;
    const winLoss  = k.winLossRatio   || 1.5;
    const currentW = (Number(p.liveValue || 0) / portfolioValue) * 100;
    const targetW  = TARGET_W[p.symbol] || TARGET_W.default;
    const score    = ces(cagr, vol, winProb, winLoss, currentW, targetW);
    const kf       = kellyFraction(winProb, winLoss) * KELLY_MULT;
    const drift    = currentW - targetW;
    const projectedPerDollar = Math.pow(1 + cagr / 100, yearsLeft);
    const isBlocked  = currentW >= HARD_CAP || score <= 0;
    const isExecuted = executedSet.has(p.symbol);

    return {
      symbol: p.symbol, cagr, vol, winProb, winLoss, currentW, targetW,
      drift, score, kellyFrac: kf * 100, isBlocked, isExecuted,
      projectedPerDollar, liveValue: Number(p.liveValue || 0),
      kellyAction: k.action || 'HOLD',
    };
  });

  // Split into executed / eligible / blocked
  const executed = scored.filter(s => s.isExecuted);
  const eligible = scored.filter(s => !s.isBlocked && !s.isExecuted).sort((a, b) => b.score - a.score);
  const blocked  = scored.filter(s => s.isBlocked && !s.isExecuted);

  // Remaining DCA after accounting for already-executed amounts
  const executedTotal = (executedSymbols || []).reduce((sum, sym) => {
    const ex = (executedSet.size > 0) ? 0 : 0; // amount tracked separately
    return sum;
  }, 0);

  // Allocation logic
  let allocation = [];
  if (eligible.length === 0) {
    allocation = [{ symbol: 'CASH', pct: 100, amount: monthlyDCA }];
  } else if (eligible.length === 1 || eligible[0].score > eligible[1].score * 1.15) {
    allocation = [{ symbol: eligible[0].symbol, pct: 100, amount: monthlyDCA }];
  } else {
    const tot = eligible[0].score + eligible[1].score;
    const p0 = eligible[0].score / tot, p1 = eligible[1].score / tot;
    allocation = [
      { symbol: eligible[0].symbol, pct: p0 * 100, amount: monthlyDCA * p0 },
      { symbol: eligible[1].symbol, pct: p1 * 100, amount: monthlyDCA * p1 },
    ];
  }

  const currentBlended = scored.reduce((s, p) => s + (p.currentW / 100) * p.cagr, 0);

  return { ranked: eligible, blocked, executed, allocation, currentBlended, requiredCAGR };
}

// ─── Briefing engine ──────────────────────────────────────────────────────────
function getCryptoSymbols(positions) {
  return positions
    .filter(p => p.assetClass === 'crypto' || ['BTC','ETH','MSTR','WBTC'].includes(p.symbol))
    .map(p => p.symbol);
}

function generateBriefing({ positions, portfolioValue, kelly, risk, regime }) {
  if (!positions.length) return [];
  const yearsLeft    = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = (Math.pow(GOAL / portfolioValue, 1 / yearsLeft) - 1) * 100;
  const total        = portfolioValue || 1;
  const sorted       = [...positions].sort((a, b) => (b.liveValue ?? 0) - (a.liveValue ?? 0));
  const CAGR         = Object.fromEntries(positions.map(p => [p.symbol, getAssetCAGR(p.symbol, regime)]));
  const cryptoSyms   = getCryptoSymbols(positions);
  const insights     = [];

  // 1. CAGR surplus / deficit
  const blended      = positions.reduce((s, p) => s + ((p.liveValue ?? 0) / total) * (CAGR[p.symbol] ?? 12), 0);
  const projected    = positions.reduce((s, p) => s + (p.liveValue ?? 0) * Math.pow(1 + (CAGR[p.symbol] ?? 12) / 100, yearsLeft), 0);

  if (blended < requiredCAGR) {
    insights.push({
      priority: requiredCAGR - blended > 5 ? 'CRITICAL' : 'HIGH', type: 'CAGR_DEFICIT',
      title: `Blended CAGR (${fmt(blended)}%) is ${fmt(requiredCAGR - blended)}% below the ${fmt(requiredCAGR)}% required`,
      body: `To reach $1M by ${GOAL_YEAR} from ${fmtUSD(portfolioValue)}, every year of underperformance compounds the deficit. Current mix projects to ${fmtUSD(projected)} — ${fmtUSD(GOAL - projected)} short.`,
      action: `Increase allocation to highest CES positions via LCPE above · exit sub-threshold drag`,
      metric: `Blended ${fmt(blended)}% vs required ${fmt(requiredCAGR)}%`,
    });
  } else {
    insights.push({
      priority: 'POSITIVE', type: 'CAGR_SURPLUS',
      title: `Blended CAGR (${fmt(blended)}%) exceeds required rate — goal trajectory intact`,
      body: `Portfolio is compounding above the ${fmt(requiredCAGR)}%/yr minimum needed for $1M by ${GOAL_YEAR}. Protect this by maintaining high-conviction positions.`,
      action: `Hold course · avoid diluting high-CAGR positions`,
      metric: `${fmt(blended - requiredCAGR)}% surplus over required rate`,
    });
  }

  // 2. Concentration mismatch
  sorted.slice(0, 5).forEach(p => {
    const weight = (p.liveValue ?? 0) / total * 100;
    const cagr   = CAGR[p.symbol] ?? 12;
    const ranks  = sorted.map(s => ({
      symbol: s.symbol,
      proj: (s.liveValue ?? 0) * Math.pow(1 + (CAGR[s.symbol] ?? 12) / 100, yearsLeft),
    })).sort((a, b) => b.proj - a.proj);
    const wRank = sorted.findIndex(s => s.symbol === p.symbol) + 1;
    const pRank = ranks.findIndex(s => s.symbol === p.symbol) + 1;
    if (weight > 20 && pRank > wRank + 1) {
      insights.push({
        priority: weight > 28 ? 'CRITICAL' : 'HIGH', type: 'CONCENTRATION_MISMATCH', symbol: p.symbol,
        title: `${p.symbol} is #${wRank} by capital but #${pRank} in ${GOAL_YEAR} projection`,
        body: `${p.symbol} holds ${fmt(weight)}% (${fmtUSD(p.liveValue ?? 0)}) but ranks #${pRank} by projected ${GOAL_YEAR} value at ${fmt(cagr)}% CAGR. Trimming ${fmt(weight - 15)}% and rotating would improve trajectory.`,
        action: `Trim ${p.symbol} to ~15% · rotate capital to LCPE #1`,
        metric: `${fmt(weight)}% weight / ${fmt(cagr)}% CAGR / #${pRank} ${GOAL_YEAR} rank`,
      });
    }
  });

  // 3. Crypto cluster
  const cryptoVal    = positions.filter(p => cryptoSyms.includes(p.symbol)).reduce((s, p) => s + (p.liveValue ?? 0), 0);
  const cryptoWeight = cryptoVal / total * 100;
  if (cryptoWeight > 25) {
    insights.push({
      priority: 'HIGH', type: 'CLUSTER_RISK', symbol: cryptoSyms.join(' + '),
      title: `Crypto cluster (${cryptoSyms.join(' + ')}) at ${fmt(cryptoWeight)}% — correlated drawdown risk`,
      body: `These assets crash together in risk-off events. Combined exposure of ${fmtUSD(cryptoVal)} means a 50% crypto correction wipes ${fmtUSD(cryptoVal * 0.5)} from your portfolio.`,
      action: `Monitor BTC dominance — highest-beta position trims first`,
      metric: `${fmt(cryptoWeight)}% combined cluster exposure`,
    });
  }

  // 4. Drag positions
  const dragThresh = Math.min(15, requiredCAGR * 0.5);
  const drags      = positions.filter(p => (CAGR[p.symbol] ?? 12) < dragThresh && (p.liveValue ?? 0) > 2000);
  if (drags.length > 0) {
    const dragVal  = drags.reduce((s, p) => s + (p.liveValue ?? 0), 0);
    const dragW    = dragVal / total * 100;
    const dragSyms = drags.map(p => p.symbol).join(', ');
    const topC     = Math.max(...Object.values(CAGR), 30);
    const dragProj = drags.reduce((s, p) => s + (p.liveValue ?? 0) * Math.pow(1 + (CAGR[p.symbol] ?? 12) / 100, yearsLeft), 0);
    insights.push({
      priority: 'MODERATE', type: 'DRAG', symbol: dragSyms,
      title: `${dragSyms} holding ${fmt(dragW)}% of capital below ${fmt(dragThresh)}% CAGR`,
      body: `${fmtUSD(dragVal)} in below-threshold positions projects to ${fmtUSD(dragProj)} by ${GOAL_YEAR} — vs ${fmtUSD(dragVal * Math.pow(1 + topC / 100, yearsLeft))} if rotated to LCPE #1. Opportunity cost compounds annually.`,
      action: `Exit or scale down ${dragSyms} · redeploy into LCPE #1 ranked position above`,
      metric: `${fmtUSD(dragVal)} at risk of underperformance`,
    });
  }

  return insights.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MODERATE: 2, POSITIVE: 3 }[a.priority] - { CRITICAL: 0, HIGH: 1, MODERATE: 2, POSITIVE: 3 }[b.priority]));
}

// ─── UI: Priority badge ───────────────────────────────────────────────────────
function Badge({ p }) {
  const col = { CRITICAL: C.red, HIGH: C.gold, MODERATE: C.blue, POSITIVE: C.green }[p] || C.textMuted;
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: col, border: `1px solid ${col}44`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {p}
    </span>
  );
}

// ─── UI: Insight card ─────────────────────────────────────────────────────────
function InsightCard({ insight }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge p={insight.priority} />
        {insight.symbol && <span style={{ ...mono, fontSize: 11, color: C.cyan, fontWeight: 700 }}>{insight.symbol}</span>}
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1 }}>{insight.title}</span>
        <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6, margin: '0 0 10px' }}>{insight.body}</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 11, color: C.gold }}>→ {insight.action}</span>
            <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{insight.metric}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UI: CES bar ──────────────────────────────────────────────────────────────
function CESBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  const col = pct > 66 ? C.green : pct > 33 ? C.gold : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 2, boxShadow: `0 0 6px ${col}60` }} />
      </div>
      <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: col, minWidth: 42, textAlign: 'right' }}>{score.toFixed(3)}</span>
    </div>
  );
}

// ─── UI: Allocation chip ──────────────────────────────────────────────────────
function AllocationChip({ symbol, pct, amount, rank, onExecute, isNew }) {
  const col = rank === 0 ? C.green : C.teal;
  return (
    <div style={{ background: `${col}10`, border: `1px solid ${col}40`, borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: `${col}18`, border: `1px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 10, fontWeight: 800, color: col }}>
        #{rank + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ ...mono, fontSize: 17, fontWeight: 800, color: C.text }}>{symbol}</span>
          <span style={{ ...mono, fontSize: 20, fontWeight: 800, color: col }}>{fmtUSD(amount)}</span>
        </div>
        <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>{pct.toFixed(0)}% of contribution · {rank === 0 ? 'primary target' : 'efficiency split'}</div>
      </div>
      {/* Execute checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onExecute(symbol, amount); }}
        title="Mark as executed this month"
        style={{
          width: 36, height: 36, borderRadius: 6, flexShrink: 0,
          background: `${col}15`, border: `2px solid ${col}60`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: col, transition: 'all 0.15s',
        }}
      >
        ✓
      </button>
    </div>
  );
}

// ─── UI: Executed row ─────────────────────────────────────────────────────────
function ExecutedRow({ exec, onUndo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 8, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${C.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.green }}>✓</div>
      <div style={{ flex: 1 }}>
        <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.green }}>{exec.symbol}</span>
        <span style={{ ...mono, fontSize: 12, color: C.textSec, marginLeft: 12 }}>{fmtUSD(exec.amount)} executed</span>
        <span style={{ ...mono, fontSize: 10, color: C.textMuted, marginLeft: 8 }}>
          {new Date(exec.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <button onClick={() => onUndo(exec.symbol)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 10px', ...mono, fontSize: 10, color: C.textMuted, cursor: 'pointer' }}>
        undo
      </button>
    </div>
  );
}

// ─── UI: Regime pill ─────────────────────────────────────────────────────────
function RegimePill({ regime }) {
  const col = regime === 'RISK_ON' || regime === 'MILD_RISK_ON' ? C.green
            : regime === 'RISK_OFF' || regime === 'MILD_RISK_OFF' ? C.red
            : C.gold;
  const mod = REGIME_MODIFIER[regime] ?? 0;
  const label = mod > 0 ? `+${mod}% CAGR adj` : mod < 0 ? `${mod}% CAGR adj` : 'No CAGR adj';
  return (
    <span style={{ ...mono, fontSize: 9, color: col, background: `${col}15`, border: `1px solid ${col}30`, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {regime} · {label}
    </span>
  );
}

// ─── UI: LCPE Panel ───────────────────────────────────────────────────────────
function LCPEPanel({ lcpe, monthlyDCA, onDCAChange, executions, onExecute, onUndo, regime, lastRefresh }) {
  const { ranked, blocked, executed: executedScored, allocation, currentBlended, requiredCAGR } = lcpe;
  const maxScore = ranked.length > 0 ? ranked[0].score : 1;

  const sigCol = a => {
    if (!a) return C.textMuted;
    const u = a.toUpperCase();
    if (u === 'ADD' || u === 'BUY' || u === 'BUY_MORE') return C.green;
    if (u.includes('TRIM') || u.includes('EXIT')) return C.red;
    return C.textMuted;
  };

  const executedSymbolSet = new Set(executions.map(e => e.symbol));
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.teal}30`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>

      {/* Header */}
      <div style={{ background: `${C.teal}08`, borderBottom: `1px solid ${C.teal}20`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: '0.12em', marginBottom: 3 }}>LIVING CAPITAL PRIORITIZATION ENGINE</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Kelly-weighted · Concentration-penalized · Regime-adjusted</span>
            <RegimePill regime={regime} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && (
            <span style={{ ...mono, fontSize: 9, color: C.textMuted }}>
              refreshed {new Date(lastRefresh).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px' }}>
            <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>Monthly DCA</span>
            <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>$</span>
            <input
              type="number"
              value={monthlyDCA}
              onChange={e => onDCAChange(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', outline: 'none', ...mono, fontSize: 13, fontWeight: 700, color: C.text, width: 65 }}
            />
          </div>
        </div>
      </div>

      {/* Allocation targets */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: '0.14em', marginBottom: 4 }}>
          NEXT CONTRIBUTION DESTINATION — {monthName}
        </div>
        <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 12, opacity: 0.7 }}>
          Click ✓ to record that you executed the contribution. Jupiter will remember for this month.
        </div>

        {allocation[0]?.symbol === 'CASH' ? (
          <div style={{ ...mono, fontSize: 14, color: C.gold, padding: '12px 0' }}>Hold cash — no eligible positions this month</div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {allocation.map((a, i) => (
              <AllocationChip key={a.symbol} symbol={a.symbol} pct={a.pct} amount={a.amount} rank={i} onExecute={onExecute} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'BLENDED CAGR',           value: fmtPct(currentBlended),                                 subtext: `need ${fmtPct(requiredCAGR)}`,        color: currentBlended >= requiredCAGR ? C.green : C.gold },
            { label: 'KELLY UTILIZATION',       value: ranked.length > 0 ? fmtPct(ranked[0].kellyFrac) : '—', subtext: '0.25× fractional Kelly',              color: C.blue },
            { label: '$1 GROWS TO BY 2037',     value: ranked.length > 0 ? `$${ranked[0].projectedPerDollar.toFixed(2)}` : '—', subtext: `in ${ranked[0]?.symbol || '—'}`, color: C.green },
            { label: 'REGIME',                  value: regime,                                                 subtext: `CAGR ${REGIME_MODIFIER[regime] >= 0 ? '+' : ''}${REGIME_MODIFIER[regime] ?? 0}% adj`, color: REGIME_MODIFIER[regime] >= 0 ? C.green : C.red },
          ].map(s => (
            <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ ...mono, fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 2 }}>{s.subtext}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Executed this month ── */}
      {executions.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ ...mono, fontSize: 9, color: C.green, letterSpacing: '0.14em', marginBottom: 10 }}>
            EXECUTED THIS MONTH — {executions.length} contribution{executions.length > 1 ? 's' : ''} recorded
          </div>
          {executions.map(ex => <ExecutedRow key={ex.symbol} exec={ex} onUndo={onUndo} />)}
        </div>
      )}

      {/* ── Full ranking table ── */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: '0.14em', marginBottom: 10 }}>
          FULL CAPITAL EFFICIENCY RANKING
          {executions.length > 0 && <span style={{ color: C.green, marginLeft: 10 }}>· executed positions excluded from ranking</span>}
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 72px 1fr 72px 52px 60px 62px 80px', gap: 8, padding: '6px 12px', ...mono, fontSize: 9, color: C.textMuted, letterSpacing: '0.06em', borderBottom: `1px solid ${C.border}` }}>
          <span>RNK</span><span>SYMBOL</span><span>CAPITAL EFFICIENCY SCORE</span>
          <span>CAGR</span><span>VOL</span><span>KELLY%</span><span>DRIFT</span><span>SIGNAL</span>
        </div>

        {/* Eligible rows */}
        {ranked.map((s, i) => (
          <div key={s.symbol} style={{ display: 'grid', gridTemplateColumns: '36px 72px 1fr 72px 52px 60px 62px 80px', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: i === 0 ? `${C.green}06` : i === 1 ? `${C.teal}04` : 'transparent', alignItems: 'center' }}>
            <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: i < 2 ? C.green : C.textMuted }}>#{i + 1}</span>
            <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: i === 0 ? C.text : C.textSec }}>{s.symbol}</span>
            <CESBar score={s.score} maxScore={maxScore} />
            <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.gold }}>{fmtPct(s.cagr)}</span>
            <span style={{ ...mono, fontSize: 11, color: C.textSec }}>{s.vol}%</span>
            <span style={{ ...mono, fontSize: 11, color: C.blue }}>{fmtPct(s.kellyFrac)}</span>
            <span style={{ ...mono, fontSize: 11, color: Math.abs(s.drift) > 5 ? (s.drift > 0 ? C.red : C.green) : C.textMuted }}>
              {s.drift > 0 ? '+' : ''}{s.drift.toFixed(1)}%
            </span>
            <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: sigCol(s.kellyAction) }}>{s.kellyAction}</span>
          </div>
        ))}

        {/* Executed — shown dimmed at the bottom of eligible list */}
        {executedScored.length > 0 && (
          <>
            <div style={{ ...mono, fontSize: 9, color: C.green, letterSpacing: '0.1em', padding: '10px 12px 4px', opacity: 0.7 }}>
              DONE THIS MONTH — removed from active ranking
            </div>
            {executedScored.map(s => (
              <div key={s.symbol} style={{ display: 'grid', gridTemplateColumns: '36px 72px 1fr 72px 52px 60px 62px 80px', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${C.border}`, opacity: 0.35, alignItems: 'center' }}>
                <span style={{ ...mono, fontSize: 11, color: C.green }}>✓</span>
                <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.green }}>{s.symbol}</span>
                <div style={{ ...mono, fontSize: 10, color: C.green }}>executed this month</div>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{fmtPct(s.cagr)}</span>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{s.vol}%</span>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{fmtPct(s.kellyFrac)}</span>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{s.drift > 0 ? '+' : ''}{s.drift.toFixed(1)}%</span>
                <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>{s.kellyAction}</span>
              </div>
            ))}
          </>
        )}

        {/* Ineligible */}
        {blocked.length > 0 && (
          <>
            <div style={{ ...mono, fontSize: 9, color: C.red, letterSpacing: '0.1em', padding: '10px 12px 4px', opacity: 0.6 }}>
              INELIGIBLE — at {HARD_CAP}% hard cap or CES ≤ 0
            </div>
            {blocked.map(s => (
              <div key={s.symbol} style={{ display: 'grid', gridTemplateColumns: '36px 72px 1fr 72px 52px 60px 62px 80px', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${C.border}`, opacity: 0.35, alignItems: 'center' }}>
                <span style={{ ...mono, fontSize: 10, color: C.red }}>—</span>
                <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.textSec }}>{s.symbol}</span>
                <div style={{ ...mono, fontSize: 10, color: C.red }}>{s.currentW >= HARD_CAP ? `AT CAP (${HARD_CAP}%)` : 'CES ≤ 0'}</div>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{fmtPct(s.cagr)}</span>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{s.vol}%</span>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>—</span>
                <span style={{ ...mono, fontSize: 11, color: C.red }}>{s.drift > 0 ? '+' : ''}{s.drift.toFixed(1)}%</span>
                <span style={{ ...mono, fontSize: 10, color: C.red }}>{s.kellyAction}</span>
              </div>
            ))}
          </>
        )}

        <div style={{ ...mono, fontSize: 9, color: C.textMuted, padding: '10px 12px 0', lineHeight: 1.7, opacity: 0.55 }}>
          CES = (Geometric return × fractional Kelly) ÷ concentration penalty ÷ volatility.
          Hard cap {HARD_CAP}% · Kelly multiplier {KELLY_MULT}× · Drift = current − target weight.
          CAGR adjusted ±{Math.abs(REGIME_MODIFIER[regime] ?? 0)}% for {regime} regime. Recomputes every 60s.
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Insights({ onNavigate }) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [monthlyDCA,  setMonthlyDCA]  = useState(DCA_DEFAULT);
  const [executions,  setExecutions]  = useState([]);  // [{ symbol, amount, executedAt }]
  const timerRef = useRef(null);

  // Derive regime from market monitor data
  const regime = useMemo(() => data?.risk?.regime || data?.snap?.regime || 'NEUTRAL', [data]);

  // Load executions from persistent storage on mount
  useEffect(() => {
    loadExecutions().then(setExecutions);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [snap, kelly, risk] = await Promise.all([
        window.jupiter.invoke('portfolio:getSnapshot'),
        window.jupiter.invoke('decisions:getKellyRecommendations'),
        window.jupiter.invoke('riskCentre:intelligence:v2').catch(() => null),
      ]);
      setData({ snap, kelly, risk });
      setLastRefresh(Date.now());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => fetchData(), REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchData]);

  // Execute a contribution — mark symbol as done for this month
  const handleExecute = useCallback(async (symbol, amount) => {
    const updated = [
      ...executions.filter(e => e.symbol !== symbol),
      { symbol, amount, executedAt: new Date().toISOString() },
    ];
    setExecutions(updated);
    await saveExecutions(updated);
  }, [executions]);

  // Undo an execution
  const handleUndo = useCallback(async (symbol) => {
    const updated = executions.filter(e => e.symbol !== symbol);
    setExecutions(updated);
    await saveExecutions(updated);
  }, [executions]);

  const positions      = useMemo(() => data?.snap?.portfolio?.positions || [], [data]);
  const portfolioValue = useMemo(() => data?.snap?.portfolio?.totals?.liveValue || 0, [data]);
  const executedSymbols = useMemo(() => executions.map(e => e.symbol), [executions]);

  const insights = useMemo(() => {
    if (!data) return [];
    return generateBriefing({ positions, portfolioValue, kelly: data.kelly, risk: data.risk, regime });
  }, [data, positions, portfolioValue, regime]);

  const lcpe = useMemo(() => {
    if (!data || !positions.length) return null;
    return runLCPE(positions, data.kelly?.actions || [], portfolioValue, monthlyDCA, regime, executedSymbols);
  }, [data, positions, portfolioValue, monthlyDCA, regime, executedSymbols]);

  const yearsLeft    = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = portfolioValue > 0 ? (Math.pow(GOAL / portfolioValue, 1 / yearsLeft) - 1) * 100 : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ ...mono, fontSize: 20, fontWeight: 800, margin: 0 }}>Intelligence Briefing</h1>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}Goal: $1M by {GOAL_YEAR}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          style={{ ...mono, fontSize: 11, color: refreshing ? C.textMuted : C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: '7px 14px', cursor: refreshing ? 'default' : 'pointer' }}
        >
          {refreshing ? '↻ refreshing…' : '↻ refresh now'}
        </button>
      </div>

      {/* Stats strip */}
      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'PORTFOLIO VALUE', value: fmtUSD(portfolioValue), color: C.text },
            { label: 'GOAL PROGRESS',   value: fmtPct(portfolioValue / GOAL * 100), color: C.blue },
            { label: 'REQUIRED CAGR',   value: fmtPct(requiredCAGR) + '/yr', color: C.gold },
            { label: 'RISK POSTURE',    value: data.risk?.posture || '—', color: data.risk?.posture === 'STABLE' ? C.green : C.gold },
            { label: 'KELLY HEAT',      value: data.kelly?.heatCheck?.status || '—', color: data.kelly?.heatCheck?.status === 'NORMAL' ? C.green : C.red },
          ].map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ ...mono, fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: C.textMuted, ...mono }}>Loading briefing…</p>}
      {error && <p style={{ color: C.red, ...mono }}>Error: {error}</p>}

      {/* LCPE */}
      {!loading && !error && lcpe && (
        <LCPEPanel
          lcpe={lcpe}
          monthlyDCA={monthlyDCA}
          onDCAChange={setMonthlyDCA}
          executions={executions}
          onExecute={handleExecute}
          onUndo={handleUndo}
          regime={regime}
          lastRefresh={lastRefresh}
        />
      )}

      {/* Morning briefing */}
      {!loading && !error && insights.length > 0 && (
        <>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.14em', marginBottom: 12 }}>
            MORNING BRIEFING · {insights.length} RANKED INSIGHTS
          </div>
          {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
        </>
      )}

      <p style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 24, opacity: 0.55 }}>
        Insights are mathematical classifications only. No actions are executed.
        LCPE: Kelly (0.25×) · Regime-adjusted CAGR · Nonlinear concentration penalty · Auto-refreshes every 60s.
        Execution history persists per calendar month and resets automatically on the 1st.
      </p>
    </div>
  );
}
