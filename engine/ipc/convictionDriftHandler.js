// engine/ipc/convictionDriftHandler.js
// Conviction Drift Audit — quarterly thesis health check with live SPY regime detection

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUDIT_FILE = path.join(__dirname, '../snapshots/convictionDriftAudit.json');
const CONVICTION_CACHE = path.join(__dirname, '../snapshots/convictionCache.json');

// ── Thesis Health Lookup (manual, you update quarterly) ──────────────────────
const THESIS_HEALTH_BASE = {
  NVDA: { health: 'STRONG', notes: 'AI dominance, TAM expanding, execution strong' },
  ASML: { health: 'HEALTHY', notes: 'Chip capex cycle intact, TSMC dependency risk' },
  AVGO: { health: 'HEALTHY', notes: 'Broadcom AI datacenter exposed, competition rising' },
  BTC: { health: 'STRONG', notes: 'Institutional adoption, macro hedge, volatility high' },
  ETH: { health: 'HEALTHY', notes: 'DeFi moat, Shanghai upgrade success, competition from L2s' },
  MSTR: { health: 'NEUTRAL', notes: 'BTC leverage play, thesis depends on macro' },
  NOW: { health: 'HEALTHY', notes: 'ServiceNow TAM, competitive pressure in workflow' },
  AXON: { health: 'WEAK', notes: 'AI law enforcement, regulatory scrutiny increasing' },
  ZETA: { health: 'HEALTHY', notes: 'Data platform, customer churn risk, AI TAM upside' },
  MELI: { health: 'HEALTHY', notes: 'LATAM ecommerce, macro headwinds in region' },
  LLY: { health: 'STRONG', notes: 'GLP-1 dominance, pricing power, pipeline strong' },
  NU: { health: 'WEAK', notes: 'Fintech Brazil, macro sensitivity, local competition' },
  RKLB: { health: 'NEUTRAL', notes: 'Space launch, execution risk, RAW margins pressure' },
};

// ── SPY Regime Detection (live via Polygon API) ──────────────────────────────
async function detectRegimeLive(apiKey) {
  try {
    // Fetch SPY last 200 days
    const now = new Date();
    const ago200 = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000);
    const from = ago200.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];

    const url = `https://api.polygon.io/v1/open-close/SPY/${to}?adjusted=true&apikey=${apiKey}`;
    const res = await fetch(url);
    const dailyData = await res.json();

    if (!dailyData.results || !Array.isArray(dailyData.results)) {
      // Fallback: assume BULL if API fails
      return {
        regime: 'BULL',
        sentiment: 0.65,
        lastUpdate: now.getTime(),
      };
    }

    // Get last 50 and 200 closes
    const closes = dailyData.results.map(r => r.c);
    const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
    const sma200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;
    const current = closes[closes.length - 1];

    // Regime logic
    let regime = 'SIDEWAYS';
    if (current > sma200 && sma50 > sma200) {
      regime = 'BULL';
    } else if (current < sma200 && sma50 < sma200) {
      regime = 'BEAR';
    }

    // Sentiment = (current - sma200) / sma200, scaled 0-1
    const sentiment = Math.max(0, Math.min(1, (current - (sma200 * 0.85)) / (sma200 * 0.3)));

    return {
      regime,
      sentiment,
      sma50,
      sma200,
      current,
      lastUpdate: now.getTime(),
    };
  } catch (err) {
    console.error('[ConvictionDrift] Regime detection failed:', err.message);
    return {
      regime: 'SIDEWAYS',
      sentiment: 0.5,
      lastUpdate: new Date().getTime(),
    };
  }
}

// ── Regime-Aware Conviction Band ─────────────────────────────────────────────
function getRegimeAdjustedBand(regime) {
  if (regime === 'BULL') {
    return [0.70, 0.95]; // High conviction expected
  } else if (regime === 'BEAR') {
    return [0.40, 0.70]; // Lower conviction acceptable
  } else {
    return [0.50, 0.80]; // Sideways: moderate
  }
}

// ── Rebalance Recommendation Logic ───────────────────────────────────────────
function getRecommendation(thesisHealth, regime, convictionScore) {
  const band = getRegimeAdjustedBand(regime);

  if (thesisHealth === 'CRITICAL') return 'EXIT';
  if (thesisHealth === 'WEAK') return convictionScore < band[0] ? 'EXIT' : 'TRIM';
  if (thesisHealth === 'NEUTRAL') return 'HOLD';
  if (thesisHealth === 'HEALTHY') return 'HOLD';
  if (thesisHealth === 'STRONG' && convictionScore >= band[0]) return 'ADD';

  return 'HOLD';
}

// ── Load Previous Quarter Snapshot ───────────────────────────────────────────
function loadPreviousQSnapshot() {
  if (!fs.existsSync(AUDIT_FILE)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
    if (data.auditHistory && data.auditHistory.length > 0) {
      return data.auditHistory[data.auditHistory.length - 1];
    }
  } catch (err) {
    console.error('[ConvictionDrift] Failed to load previous snapshot:', err.message);
  }
  return null;
}

// ── Load Current Convictions ─────────────────────────────────────────────────
function loadCurrentConvictions() {
  if (!fs.existsSync(CONVICTION_CACHE)) {
    return {};
  }
  try {
    const data = JSON.parse(fs.readFileSync(CONVICTION_CACHE, 'utf8'));
    return data.convictions || {};
  } catch (err) {
    console.error('[ConvictionDrift] Failed to load convictions:', err.message);
    return {};
  }
}

// ── Run Quarterly Drift Audit ────────────────────────────────────────────────
export async function runConvictionDriftAudit(apiKey) {
  const now = new Date();
  const quarterEnd = getCurrentQuarterEnd(now);
  const currentConvictions = loadCurrentConvictions();
  const previousSnapshot = loadPreviousQSnapshot();
  const regime = await detectRegimeLive(apiKey);

  const auditData = {
    quarterEnd: quarterEnd.toISOString().split('T')[0],
    regime: regime.regime,
    regimeSentiment: regime.sentiment,
    lastUpdate: now.getTime(),
    assets: {},
  };

  // Build per-asset audit
  for (const [symbol, conviction] of Object.entries(currentConvictions)) {
    const convictionScore = conviction.conviction || 0;
    const thesisBase = THESIS_HEALTH_BASE[symbol] || { health: 'NEUTRAL', notes: 'No thesis data' };
    const previousData = previousSnapshot?.assets?.[symbol];
    const driftFromPreviousQ = previousData
      ? convictionScore - previousData.convictionScore
      : 0;

    const band = getRegimeAdjustedBand(regime.regime);
    const recommendation = getRecommendation(thesisBase.health, regime.regime, convictionScore);

    auditData.assets[symbol] = {
      convictionScore,
      confidence: conviction.confidence || '—',
      thesisHealth: thesisBase.health,
      executionNotes: thesisBase.notes,
      driftFromPreviousQ,
      regimeAdjustedBand: band,
      recommendation,
    };
  }

  // Save to audit file
  let auditHistory = [];
  if (fs.existsSync(AUDIT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
      auditHistory = existing.auditHistory || [];
    } catch (err) {
      console.error('[ConvictionDrift] Could not load existing audit history:', err.message);
    }
  }

  auditHistory.push(auditData);
  fs.writeFileSync(AUDIT_FILE, JSON.stringify({ auditHistory }, null, 2));

  return {
    ok: true,
    audit: auditData,
    regime,
  };
}

// ── Helper: Get Quarter End Date ─────────────────────────────────────────────
function getCurrentQuarterEnd(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  let quarterEnd;
  if (month < 3) {
    quarterEnd = new Date(year, 2, 31); // Q1 ends Mar 31
  } else if (month < 6) {
    quarterEnd = new Date(year, 5, 30); // Q2 ends Jun 30
  } else if (month < 9) {
    quarterEnd = new Date(year, 8, 30); // Q3 ends Sep 30
  } else {
    quarterEnd = new Date(year, 11, 31); // Q4 ends Dec 31
  }

  return quarterEnd;
}
