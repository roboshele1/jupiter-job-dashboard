/**
 * engine/scanner/portfolioScanEngine.js
 * Daily Portfolio Scan Engine — Polls holdings, recalculates Kelly signals, detects changes
 * 
 * Responsibility: Load holdings → fetch prices → recalculate Kelly → detect signal changes → write scan record
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { valuePortfolio } from '../portfolio/portfolioValuation.js';
import { resolvePrices } from '../market/priceResolver.js';

const __scanner_dirname = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_JSON = path.resolve(__scanner_dirname, '../data/users/default/holdings.json');
const SCANS_JSON = path.resolve(__scanner_dirname, '../data/portfolio_scans.json');
const PRICE_CACHE_JSON = path.resolve(__scanner_dirname, '../data/price_cache.json');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function generateScanId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substr(2, 5);
  return `scan_${ts}_${rand}`;
}

function loadHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_JSON, 'utf-8');
    const h = JSON.parse(raw);
    if (!Array.isArray(h)) throw new Error('HOLDINGS_FILE_INVALID');
    console.log(`[PortfolioScanEngine] Loaded ${h.length} holdings`);
    return h;
  } catch (err) {
    console.error('[PortfolioScanEngine] Error loading holdings:', err.message);
    throw err;
  }
}

function loadPreviousScan() {
  try {
    if (!fs.existsSync(SCANS_JSON)) return null;
    const raw = fs.readFileSync(SCANS_JSON, 'utf-8');
    const scans = JSON.parse(raw);
    if (!Array.isArray(scans) || scans.length === 0) return null;
    return scans[scans.length - 1]; // Last scan
  } catch (err) {
    console.error('[PortfolioScanEngine] Error loading previous scan:', err.message);
    return null;
  }
}

function loadScanHistory(count = 10) {
  try {
    if (!fs.existsSync(SCANS_JSON)) return [];
    const raw = fs.readFileSync(SCANS_JSON, 'utf-8');
    const scans = JSON.parse(raw);
    return Array.isArray(scans) ? scans.slice(-count) : [];
  } catch (err) {
    console.error('[PortfolioScanEngine] Error loading scan history:', err.message);
    return [];
  }
}

function appendScan(scanRecord) {
  try {
    let scans = [];
    if (fs.existsSync(SCANS_JSON)) {
      const raw = fs.readFileSync(SCANS_JSON, 'utf-8');
      scans = JSON.parse(raw);
      if (!Array.isArray(scans)) scans = [];
    }
    scans.push(scanRecord);
    fs.writeFileSync(SCANS_JSON, JSON.stringify(scans, null, 2));
    console.log(`[PortfolioScanEngine] Appended scan ${scanRecord.scanId}`);
    return true;
  } catch (err) {
    console.error('[PortfolioScanEngine] Error appending scan:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// KELLY SIGNAL LOGIC
// ─────────────────────────────────────────────────────────────

/**
 * Determine Kelly signal based on weight delta and CAGR
 * 
 * TRIM: actual_weight > kelly_target + 3pp
 * ADD:  actual_weight < kelly_target - 2pp
 * EXIT: projected_cagr < 12% OR thesis_flagged
 * HOLD: otherwise
 */
function determineKellySignal(holding) {
  const {
    weight = 0,
    kellyTarget = 0,
    projectedCAGR = 0,
    thesisFlagged = false
  } = holding;

  const weightDelta = weight - kellyTarget;

  if (thesisFlagged || projectedCAGR < 12) {
    return 'EXIT_OR_AVOID';
  }

  if (weightDelta > 3) {
    return 'TRIM';
  }

  if (weightDelta < -2) {
    return 'ADD';
  }

  return 'HOLD';
}

// ─────────────────────────────────────────────────────────────
// MARKET REGIME DETECTION (simplified)
// ─────────────────────────────────────────────────────────────

/**
 * Placeholder: In production, would call marketRegimeEngine
 * Returns BULLISH, NEUTRAL, or BEARISH
 */
function detectMarketRegime(positions) {
  // Simple heuristic: if avg position delta > 2%, BULLISH; < -2%, BEARISH; else NEUTRAL
  if (positions.length === 0) return 'NEUTRAL';
  
  const avgDelta = positions.reduce((sum, p) => sum + p.deltaPct, 0) / positions.length;
  
  if (avgDelta > 2) return 'BULLISH';
  if (avgDelta < -2) return 'BEARISH';
  return 'NEUTRAL';
}

// ─────────────────────────────────────────────────────────────
// PROJECTED CAGR (simplified)
// ─────────────────────────────────────────────────────────────

/**
 * Estimate projected CAGR for holding
 * Simplified: use historical delta + regime adjustment
 */
function estimateProjectedCAGR(holding) {
  const { deltaPct = 0 } = holding;
  
  // Simple model: if positive, estimate 12-20% CAGR based on delta
  // In production, would use more sophisticated models
  if (deltaPct > 10) return 18;
  if (deltaPct > 5) return 15;
  if (deltaPct > 0) return 12;
  return Math.max(0, 8 - Math.abs(deltaPct));
}

// ─────────────────────────────────────────────────────────────
// KELLY TARGET WEIGHT (simplified)
// ─────────────────────────────────────────────────────────────

/**
 * Simplified Kelly position sizing
 * In production, would use full Kelly decision engine
 * Returns target % of portfolio for this holding
 */
function estimateKellyTarget(symbol, portfolioValue) {
  // Placeholder: Most positions 8-12% of portfolio
  // High conviction: 12-15%
  // Low conviction: 5-8%
  const highConvictionSymbols = ['NVDA', 'BTC', 'ASML'];
  
  if (highConvictionSymbols.includes(symbol)) {
    return 12.0;
  }
  
  return 8.0;
}

// ─────────────────────────────────────────────────────────────
// MAIN SCAN FUNCTION
// ─────────────────────────────────────────────────────────────

/**
 * Execute daily portfolio scan
 * Returns: { success, scanRecord, changes, error? }
 */
export async function runDailyScan() {
  const scanId = generateScanId();
  const startTime = Date.now();
  
  try {
    console.log(`[PortfolioScanEngine] Starting scan ${scanId}...`);
    
    // Load holdings
    const holdings = loadHoldings();
    if (!holdings || holdings.length === 0) {
      throw new Error('No holdings loaded');
    }
    
    // Value portfolio (uses existing engine)
    const valuation = await valuePortfolio(holdings);
    const { totals, positions } = valuation;
    
    if (!positions || positions.length === 0) {
      throw new Error('No positions in valuation');
    }
    
    // Enrich with Kelly targets and signals
    const enrichedPositions = positions.map(pos => {
      const kellyTarget = estimateKellyTarget(pos.symbol, totals.liveValue);
      const projectedCAGR = estimateProjectedCAGR(pos);
      const weight = (pos.liveValue / totals.liveValue) * 100;
      
      return {
        symbol: pos.symbol,
        qty: pos.qty,
        costBasis: pos.totalCostBasis,
        currentPrice: pos.livePrice,
        currentValue: pos.liveValue,
        weight: Number(weight.toFixed(2)),
        kellyTarget: Number(kellyTarget.toFixed(2)),
        weightDelta: Number((weight - kellyTarget).toFixed(2)),
        projectedCAGR: Number(projectedCAGR.toFixed(1)),
        thesisFlagged: false, // TODO: integrate with thesis tracking
        kellySignal: null // computed below
      };
    });
    
    // Assign Kelly signals
    enrichedPositions.forEach(pos => {
      pos.kellySignal = determineKellySignal(pos);
    });
    
    // Detect market regime
    const regime = detectMarketRegime(positions);
    
    // Load previous scan to detect signal changes
    const previousScan = loadPreviousScan();
    const signalChanges = [];
    
    if (previousScan && previousScan.holdings) {
      enrichedPositions.forEach(newPos => {
        const oldPos = previousScan.holdings.find(h => h.symbol === newPos.symbol);
        if (oldPos && oldPos.kellySignal !== newPos.kellySignal) {
          signalChanges.push({
            symbol: newPos.symbol,
            previousSignal: oldPos.kellySignal,
            newSignal: newPos.kellySignal,
            reason: `Weight delta: ${newPos.weightDelta.toFixed(2)}pp (target: ${newPos.kellyTarget}%)`,
            scanCount: 1 // Will be updated by draftDecisionEngine
          });
        }
      });
      
      // Also detect NEW holdings not in previous scan
      enrichedPositions.forEach(newPos => {
        if (!previousScan.holdings.find(h => h.symbol === newPos.symbol)) {
          signalChanges.push({
            symbol: newPos.symbol,
            previousSignal: null,
            newSignal: newPos.kellySignal,
            reason: 'New holding added to portfolio',
            scanCount: 1
          });
        }
      });
    } else {
      // First scan ever
      enrichedPositions.forEach(pos => {
        signalChanges.push({
          symbol: pos.symbol,
          previousSignal: null,
          newSignal: pos.kellySignal,
          reason: 'Initial scan',
          scanCount: 1
        });
      });
    }
    
    // Build scan record
    const scanRecord = {
      scanId,
      timestamp: new Date().toISOString(),
      scanType: 'DAILY_4PM_ET',
      regime,
      portfolioMetrics: {
        totalValue: Number(totals.liveValue.toFixed(2)),
        totalCostBasis: Number(totals.snapshotValue.toFixed(2)),
        unrealizedPL: Number(totals.delta.toFixed(2)),
        unrealizedPLPct: Number(totals.deltaPct.toFixed(2))
      },
      holdings: enrichedPositions,
      signalChanges,
      success: true,
      error: null,
      executionTimeMs: Date.now() - startTime
    };
    
    // Append to scan history
    appendScan(scanRecord);
    
    console.log(`[PortfolioScanEngine] Scan ${scanId} completed. Signal changes: ${signalChanges.length}`);
    
    return {
      success: true,
      scanRecord,
      changes: signalChanges,
      error: null
    };
    
  } catch (err) {
    console.error(`[PortfolioScanEngine] Scan ${scanId} failed:`, err.message);
    
    // Log failed scan
    const failedScan = {
      scanId,
      timestamp: new Date().toISOString(),
      scanType: 'DAILY_4PM_ET',
      success: false,
      error: err.message,
      executionTimeMs: Date.now() - startTime
    };
    
    appendScan(failedScan);
    
    return {
      success: false,
      scanRecord: failedScan,
      changes: [],
      error: err.message
    };
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORTS FOR IPC / Daemon
// ─────────────────────────────────────────────────────────────

export function getLatestScans(count = 10) {
  return loadScanHistory(count);
}

export function getScanById(scanId) {
  const scans = loadScanHistory(100);
  return scans.find(s => s.scanId === scanId);
}

export function getScanStats() {
  const scans = loadScanHistory(30);
  const latestScan = scans.length > 0 ? scans[scans.length - 1] : null;
  
  const signalChangeCount = scans.reduce((sum, s) => {
    return sum + (s.signalChanges ? s.signalChanges.length : 0);
  }, 0);
  
  const successCount = scans.filter(s => s.success).length;
  
  return {
    latestScanId: latestScan?.scanId || null,
    latestScanTime: latestScan?.timestamp || null,
    scansIn30Days: scans.length,
    successRate: scans.length > 0 ? ((successCount / scans.length) * 100).toFixed(1) : 0,
    totalSignalChanges: signalChangeCount
  };
}
