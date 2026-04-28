// electron/ipc/insightsIpc.js
// Insights decision ledger recording

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = '/Users/theadoos/JUPITER/snapshots/decision_ledger.json';

function loadLedger() {
  try {
    const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLedger(entries) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries, null, 2), 'utf-8');
}

export function registerInsightsIpc(ipcMain) {
  ipcMain.handle('insights:record', async (_event, payload) => {
    try {
      const ledger = loadLedger();
      const entry = {
        timestamp: payload.timestamp || Date.now(),
        type: payload.type || 'unknown',
        data: payload.data || {},
      };
      ledger.push(entry);
      saveLedger(ledger);
      return { ok: true, entryCount: ledger.length };
    } catch (err) {
      console.error('[insights:record] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Insights handler registered (insights:record) ✓');

  ipcMain.handle('ledger:getHistory', async () => {
    try {
      const ledger = loadLedger();
      const entries = ledger
        .filter(e => e.portfolioValue && e.timestamp)
        .map(e => ({
          timestamp: typeof e.timestamp === 'number'
            ? new Date(e.timestamp).toISOString()
            : e.timestamp,
          portfolioValue: Number(e.portfolioValue),
        }));
      return { ok: true, data: entries };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Insights handler registered (ledger:getHistory) ✓');

  ipcMain.handle('ledger:snapshotValue', async (_event, payload) => {
    try {
      const ledger = loadLedger();
      // Only snapshot once per day — check last entry date
      const today = new Date().toISOString().slice(0, 10);
      const lastEntry = ledger[ledger.length - 1];
      const lastDate = lastEntry?.timestamp?.slice(0, 10);
      if (lastDate === today) return { ok: true, skipped: true };
      ledger.push({
        id: 'SNAPSHOT_' + Date.now(),
        timestamp: payload.timestamp || new Date().toISOString(),
        type: 'DAILY_SNAPSHOT',
        portfolioValue: Number(payload.portfolioValue),
        holdingCount: payload.holdingCount || 0,
      });
      fs.writeFileSync('/Users/theadoos/JUPITER/snapshots/decision_ledger.json', JSON.stringify(ledger, null, 2), 'utf-8');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Insights handler registered (ledger:snapshotValue) ✓');


  // ─────────────────────────────────────────────────────────────────────────
  // ML LAYER — Pure math, no third parties
  // ─────────────────────────────────────────────────────────────────────────

  // ml:regimeClassifier
  // Reads the last N ledger snapshots + current system state.
  // Outputs: { regime, confidence, signal, basis }
  // Regimes: ACCUMULATE | HOLD | REDUCE | DANGER
  ipcMain.handle('ml:regimeClassifier', async (_event, payload) => {
    try {
      const ledger = loadLedger();
      const snapshots = ledger
        .filter(e => e.portfolioValue && e.timestamp)
        .map(e => ({ ts: new Date(e.timestamp).getTime(), val: Number(e.portfolioValue) }))
        .sort((a, b) => a.ts - b.ts);

      // Need at least 3 snapshots to classify
      if (snapshots.length < 3) {
        return { ok: true, data: { regime: 'HOLD', confidence: 0, signal: 'Insufficient history', basis: [] } };
      }

      const vals = snapshots.map(s => s.val);
      const n = vals.length;
      const last = vals[n - 1];
      const prev = vals[n - 2];
      const oldest = vals[0];

      // 1. Momentum: rate of change over full window
      const totalReturn = (last - oldest) / oldest;

      // 2. Short momentum: last two snapshots
      const shortMomentum = (last - prev) / prev;

      // 3. Drawdown from peak
      const peak = Math.max(...vals);
      const drawdown = (last - peak) / peak;

      // 4. Volatility: std dev of daily returns
      const returns = [];
      for (let i = 1; i < vals.length; i++) returns.push((vals[i] - vals[i-1]) / vals[i-1]);
      const meanRet = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + Math.pow(r - meanRet, 2), 0) / returns.length;
      const vol = Math.sqrt(variance);

      // 5. Trend: linear regression slope (normalised)
      const xs = snapshots.map((_, i) => i);
      const xMean = xs.reduce((s, x) => s + x, 0) / n;
      const yMean = vals.reduce((s, v) => s + v, 0) / n;
      const slope = xs.reduce((s, x, i) => s + (x - xMean) * (vals[i] - yMean), 0) /
                    xs.reduce((s, x) => s + Math.pow(x - xMean, 2), 0);
      const normSlope = slope / yMean; // as fraction of portfolio per step

      // Scoring: each factor casts a vote [-1, 0, +1]
      const votes = {
        momentum:      totalReturn > 0.05 ? 1 : totalReturn < -0.05 ? -1 : 0,
        shortMomentum: shortMomentum > 0.01 ? 1 : shortMomentum < -0.02 ? -1 : 0,
        drawdown:      drawdown > -0.05 ? 1 : drawdown < -0.15 ? -1 : 0,
        volatility:    vol < 0.02 ? 1 : vol > 0.05 ? -1 : 0,
        trend:         normSlope > 0.005 ? 1 : normSlope < -0.005 ? -1 : 0,
      };

      const score = Object.values(votes).reduce((s, v) => s + v, 0); // -5 to +5
      const confidence = Math.abs(score) / 5;

      let regime;
      if (score >= 3)       regime = 'ACCUMULATE';
      else if (score >= 0)  regime = 'HOLD';
      else if (score >= -2) regime = 'REDUCE';
      else                  regime = 'DANGER';

      const signals = [];
      if (votes.drawdown  === -1) signals.push(`drawdown ${(drawdown*100).toFixed(1)}%`);
      if (votes.volatility === -1) signals.push(`elevated vol ${(vol*100).toFixed(1)}%`);
      if (votes.momentum  === 1)  signals.push(`trend +${(totalReturn*100).toFixed(1)}%`);
      if (votes.shortMomentum === -1) signals.push('recent pullback');

      return {
        ok: true,
        data: {
          regime,
          confidence: Math.round(confidence * 100),
          signal: signals.length ? signals.join(' · ') : 'Stable conditions',
          votes,
          drawdown: Math.round(drawdown * 100),
          volatility: Math.round(vol * 100 * 100) / 100,
          snapshotCount: n,
        }
      };
    } catch (err) {
      console.error('[ml:regimeClassifier]', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] ML handler registered (ml:regimeClassifier) ✓');

  // ml:entryTimingScore
  // Per-symbol entry quality score 0–100.
  // Inputs: { symbol, price, sma20, sma50, w40, trend, momentum }
  // Output: { score, grade, factors, verdict }
  ipcMain.handle('ml:entryTimingScore', async (_event, payload) => {
    try {
      const { symbol, price, sma20, sma50, w40, trend, momentum, location } = payload || {};
      if (!price || !sma20 || !sma50) {
        return { ok: true, data: { score: 50, grade: 'C', verdict: 'Insufficient data', factors: [] } };
      }

      const factors = [];
      let score = 50; // baseline neutral

      // Factor 1: Price vs SMA20 — want slight pullback, not overextended
      const vsSma20 = ((price - sma20) / sma20) * 100;
      if (vsSma20 < -10) { score += 20; factors.push({ name: 'SMA20 pullback', impact: +20, note: `${vsSma20.toFixed(1)}% below SMA20 — deep value` }); }
      else if (vsSma20 < -3) { score += 12; factors.push({ name: 'SMA20 dip', impact: +12, note: `${vsSma20.toFixed(1)}% below SMA20` }); }
      else if (vsSma20 < 5)  { score += 5;  factors.push({ name: 'SMA20 near', impact: +5, note: 'Near SMA20 — fair entry' }); }
      else if (vsSma20 > 20) { score -= 18; factors.push({ name: 'SMA20 extended', impact: -18, note: `${vsSma20.toFixed(1)}% above SMA20 — chasing` }); }
      else if (vsSma20 > 10) { score -= 8;  factors.push({ name: 'SMA20 elevated', impact: -8, note: `${vsSma20.toFixed(1)}% above SMA20` }); }

      // Factor 2: Price vs SMA50 — structural support
      const vsSma50 = ((price - sma50) / sma50) * 100;
      if (vsSma50 < -5)  { score += 15; factors.push({ name: 'Below SMA50', impact: +15, note: `${vsSma50.toFixed(1)}% — structural discount` }); }
      else if (vsSma50 < 0)  { score += 8;  factors.push({ name: 'Near SMA50', impact: +8, note: 'Testing structural support' }); }
      else if (vsSma50 > 30) { score -= 12; factors.push({ name: 'Far above SMA50', impact: -12, note: 'Extended from structure' }); }

      // Factor 3: 40-week SMA — long-term cycle
      if (w40) {
        const vsW40 = ((price - w40) / w40) * 100;
        if (vsW40 < -10) { score += 10; factors.push({ name: '40W deep value', impact: +10, note: `${vsW40.toFixed(1)}% below 40W` }); }
        else if (vsW40 > 40) { score -= 10; factors.push({ name: '40W extended', impact: -10, note: `${vsW40.toFixed(1)}% above 40W cycle` }); }
      }

      // Factor 4: Trend alignment
      if (trend === 'UPTREND')   { score += 8;  factors.push({ name: 'Uptrend', impact: +8, note: 'Buying in direction of trend' }); }
      if (trend === 'DOWNTREND') { score -= 15; factors.push({ name: 'Downtrend', impact: -15, note: 'Counter-trend entry — high risk' }); }

      // Factor 5: Momentum
      if (momentum === 'STRONG') { score -= 5; factors.push({ name: 'Strong momentum', impact: -5, note: 'May be overbought short-term' }); }
      if (momentum === 'WEAK')   { score += 8; factors.push({ name: 'Weak momentum', impact: +8, note: 'Potential reversal setup' }); }

      // Factor 6: Location context
      if (location === 'ABOVE_ALL_MAS')  { score -= 5; factors.push({ name: 'Above all MAs', impact: -5, note: 'No nearby support' }); }
      if (location === 'BELOW_ALL_MAS')  { score += 10; factors.push({ name: 'Below all MAs', impact: +10, note: 'Maximum discount zone' }); }
      if (location === 'NEAR_52W_LOW')   { score += 8; factors.push({ name: '52W low zone', impact: +8, note: 'Historically favourable entry' }); }

      // Clamp 0–100
      score = Math.max(0, Math.min(100, Math.round(score)));

      let grade;
      if (score >= 80) grade = 'A';
      else if (score >= 65) grade = 'B';
      else if (score >= 50) grade = 'C';
      else if (score >= 35) grade = 'D';
      else grade = 'F';

      const verdicts = {
        A: 'Strong entry — multiple factors aligned',
        B: 'Good entry — favourable setup',
        C: 'Neutral — no clear edge',
        D: 'Weak entry — wait for better setup',
        F: 'Avoid — poor timing conditions',
      };

      return {
        ok: true,
        data: { symbol, score, grade, verdict: verdicts[grade], factors }
      };
    } catch (err) {
      console.error('[ml:entryTimingScore]', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] ML handler registered (ml:entryTimingScore) ✓');

  // ml:cagrForecast
  // Reads ledger snapshots, fits OLS regression, projects 1/3/5yr values with ±1σ bands.
  // Output: { currentValue, cagr, projections: [{years, low, mid, high}], rSquared, dataPoints }
  ipcMain.handle('ml:cagrForecast', async () => {
    try {
      const ledger = loadLedger();
      const snapshots = ledger
        .filter(e => e.portfolioValue && e.timestamp)
        .map(e => ({ ts: new Date(e.timestamp).getTime(), val: Number(e.portfolioValue) }))
        .sort((a, b) => a.ts - b.ts);

      if (snapshots.length < 2) {
        return { ok: true, data: { cagr: null, projections: [], dataPoints: snapshots.length, rSquared: null } };
      }

      const n = snapshots.length;
      const t0 = snapshots[0].ts;
      const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

      // Convert to (years_elapsed, log_value) for log-linear regression
      // log(V) = log(V0) + r*t  →  slope = r = instantaneous growth rate
      const points = snapshots.map(s => ({
        x: (s.ts - t0) / MS_PER_YEAR,
        y: Math.log(s.val),
      }));

      const xMean = points.reduce((s, p) => s + p.x, 0) / n;
      const yMean = points.reduce((s, p) => s + p.y, 0) / n;
      const slope = points.reduce((s, p) => s + (p.x - xMean) * (p.y - yMean), 0) /
                    points.reduce((s, p) => s + Math.pow(p.x - xMean, 2), 0);
      const intercept = yMean - slope * xMean;

      // CAGR from continuous rate: CAGR = e^slope - 1
      const cagr = (Math.exp(slope) - 1) * 100;

      // R² — goodness of fit
      const ssTot = points.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0);
      const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (intercept + slope * p.x), 2), 0);
      const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

      // Residual std dev for confidence bands
      const residuals = points.map(p => p.y - (intercept + slope * p.x));
      const residMean = residuals.reduce((s, r) => s + r, 0) / n;
      const residVar = residuals.reduce((s, r) => s + Math.pow(r - residMean, 2), 0) / Math.max(n - 2, 1);
      const residStd = Math.sqrt(residVar);

      const currentYears = (Date.now() - t0) / MS_PER_YEAR;
      const currentValue = Math.exp(intercept + slope * currentYears);

      // Project forward: 1, 3, 5 years from now
      const projections = [1, 3, 5].map(yrs => {
        const futureX = currentYears + yrs;
        const logMid = intercept + slope * futureX;
        return {
          years: yrs,
          low:   Math.round(Math.exp(logMid - 1.5 * residStd)),
          mid:   Math.round(Math.exp(logMid)),
          high:  Math.round(Math.exp(logMid + 1.5 * residStd)),
        };
      });

      return {
        ok: true,
        data: {
          cagr: Math.round(cagr * 10) / 10,
          currentValue: Math.round(currentValue),
          projections,
          rSquared: Math.round(rSquared * 100) / 100,
          dataPoints: n,
          slope: Math.round(slope * 10000) / 10000,
        }
      };
    } catch (err) {
      console.error('[ml:cagrForecast]', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] ML handler registered (ml:cagrForecast) ✓');


}
