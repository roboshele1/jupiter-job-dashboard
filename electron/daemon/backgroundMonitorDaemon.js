// electron/daemon/backgroundMonitorDaemon.js
// Runs continuously in main process
// Updates Kelly convictions every hour, alerts on significant shifts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeQuantitativeConvictions } from '../../engine/conviction/quantitativeConvictions.js';
import { valuePortfolio } from '../../engine/portfolio/portfolioValuation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONVICTION_CACHE_PATH = path.resolve(__dirname, '../../engine/snapshots/convictionCache.json');
const ALERT_LOG_PATH = path.resolve(__dirname, '../../engine/snapshots/alertLog.json');
const HOLDINGS_PATH = path.resolve(__dirname, '../../engine/data/users/default/holdings.json');

const CONVICTION_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour
const SHIFT_THRESHOLD = 0.15; // 15% shift triggers alert

let daemonRunning = false;
let daemonIntervalId = null;
let convictionBroadcaster = null; // Will be set by main process

function loadHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadConvictionCache() {
  try {
    const raw = fs.readFileSync(CONVICTION_CACHE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      timestamp: Date.now(),
      convictions: {},
      updateHistory: [],
    };
  }
}

function saveConvictionCache(cache) {
  try {
    fs.writeFileSync(CONVICTION_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function loadAlertLog() {
  try {
    const raw = fs.readFileSync(ALERT_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAlertLog(alerts) {
  try {
    fs.writeFileSync(ALERT_LOG_PATH, JSON.stringify(alerts, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}


// ── Position Drift + Entry Opportunity Checker ────────────────────────────
// Runs every daemon cycle alongside conviction update.
// Reads latest technical snapshot, scores each position,
// fires alerts when: score >= 75 (buy signal) or position down >15% from cost

async function checkPositionAlerts() {
  try {
    const holdings = loadHoldings();
    if (!holdings?.length) return [];

    const alerts = [];
    const now = Date.now();

    // Load latest valuation snapshot from ledger (no dynamic imports)
    const LEDGER_PATH = path.resolve(__dirname, '../../snapshots/decision_ledger.json');
    let lastValue = null;
    try {
      const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
      const last = ledger.filter(e => e.portfolioValue).slice(-1)[0];
      lastValue = last?.portfolioValue || null;
    } catch { lastValue = null; }

    for (const h of holdings) {
      const costBasis = Number(h.totalCostBasis || 0);
      if (!costBasis) continue;

      // Alert 1: Use avgCost vs current price from holdings if available
      const avgCost = Number(h.avgCost || h.costPerShare || 0);
      const currentPrice = Number(h.currentPrice || h.price || 0);
      if (avgCost > 0 && currentPrice > 0) {
        const deltaPct = ((currentPrice - avgCost) / avgCost) * 100;
        if (deltaPct < -15) {
          const severity = deltaPct < -25 ? 'HIGH' : 'MEDIUM';
          alerts.push({
            id: `drift_${now}_${h.symbol}`,
            timestamp: now,
            symbol: h.symbol,
            type: 'POSITION_DRIFT',
            severity,
            message: `${h.symbol} is ${deltaPct.toFixed(1)}% below avg cost — review thesis`,
            deltaPct: Number(deltaPct.toFixed(2)),
            avgCost,
            currentPrice,
          });
        }
      }
    }

    return alerts;
  } catch (err) {
    console.error('[Daemon] Position drift check failed:', err.message);
    return [];
  }
}

async function updateConvictions() {
  try {
    const holdings = loadHoldings();
    if (!holdings || holdings.length === 0) {
      console.log('[Daemon] No holdings found, skipping conviction update');
      return;
    }

    const symbols = holdings.map(h => h.symbol);
    const newConvictions = await computeQuantitativeConvictions(symbols).catch(() => {
      console.error('[Daemon] Failed to compute convictions, using cache');
      return loadConvictionCache().convictions;
    });

    const cache = loadConvictionCache();
    const previousConvictions = cache.convictions || {};

    // Detect significant shifts
    const shifts = {};
    const alerts = [];

    Object.entries(newConvictions).forEach(([symbol, newData]) => {
      const oldConviction = previousConvictions[symbol]?.conviction || 0.5;
      const newConviction = newData.conviction || 0.5;
      const delta = Math.abs(newConviction - oldConviction);

      if (delta >= SHIFT_THRESHOLD) {
        shifts[symbol] = {
          oldConviction: Number(oldConviction.toFixed(3)),
          newConviction: Number(newConviction.toFixed(3)),
          delta: Number(delta.toFixed(3)),
          direction: newConviction > oldConviction ? 'UP' : 'DOWN',
        };

        alerts.push({
          id: `alert_${Date.now()}_${symbol}`,
          timestamp: Date.now(),
          symbol,
          type: 'CONVICTION_SHIFT',
          severity: delta > 0.25 ? 'HIGH' : 'MEDIUM',
          message: `${symbol} conviction shifted ${newConviction > oldConviction ? '↑' : '↓'} from ${(oldConviction * 100).toFixed(0)}/100 to ${(newConviction * 100).toFixed(0)}/100`,
          oldConviction,
          newConviction,
          delta,
        });
      }
    });

    // Update cache
    cache.convictions = newConvictions;
    cache.timestamp = Date.now();
    cache.updateHistory.push({
      timestamp: Date.now(),
      shiftCount: Object.keys(shifts).length,
      shifts,
    });

    // Keep last 30 update history
    if (cache.updateHistory.length > 30) {
      cache.updateHistory = cache.updateHistory.slice(-30);
    }

    saveConvictionCache(cache);

    // Position drift + entry opportunity alerts
    const positionAlerts = await checkPositionAlerts();
    if (positionAlerts.length > 0) {
      alerts.push(...positionAlerts);
    }

    // Log alerts
    if (alerts.length > 0) {
      const alertLog = loadAlertLog();
      alertLog.push(...alerts);
      
      // Keep last 100 alerts
      if (alertLog.length > 100) {
        alertLog.splice(0, alertLog.length - 100);
      }
      
      saveAlertLog(alertLog);

      console.log(`[Daemon] ${alerts.length} alerts generated at ${new Date().toISOString()}`);

      // Broadcast to renderer if callback exists
      if (convictionBroadcaster) {
        convictionBroadcaster({
          type: 'CONVICTION_UPDATE',
          timestamp: Date.now(),
          convictions: newConvictions,
          alerts,
          shifts,
        });
      }
    } else {
      console.log(`[Daemon] Conviction update at ${new Date().toISOString()} - no significant shifts`);
    }
  } catch (err) {
    console.error('[Daemon] Conviction update failed:', err.message);
  }
}

export function startBackgroundMonitorDaemon(broadcasterCallback) {
  if (daemonRunning) {
    console.log('[Daemon] Already running, skipping start');
    return;
  }

  convictionBroadcaster = broadcasterCallback;
  daemonRunning = true;

  // Update immediately on start
  updateConvictions();

  // Then update every hour
  daemonIntervalId = setInterval(updateConvictions, CONVICTION_UPDATE_INTERVAL);

  console.log('[Daemon] Background monitor started ✓ (updates every 60 minutes)');
}

export function stopBackgroundMonitorDaemon() {
  if (daemonIntervalId) {
    clearInterval(daemonIntervalId);
    daemonIntervalId = null;
  }
  daemonRunning = false;
  console.log('[Daemon] Background monitor stopped');
}

export function getConvictionCache() {
  return loadConvictionCache();
}

export function getAlertLog() {
  return loadAlertLog();
}

export function isDaemonRunning() {
  return daemonRunning;
}
