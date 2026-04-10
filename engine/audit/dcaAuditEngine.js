/**
 * dcaAuditEngine.js
 * DCA Execution Audit — tracks every allocation decision and measures drift
 * 
 * Logs:
 *   - Date, symbol, amount allocated
 *   - Entry price at time of allocation (fetched live from Polygon)
 *   - Current price (live from Polygon)
 *   - Actual return since allocation
 *   - Expected monthly drift (CAGR-based)
 *   - Beat/miss signal
 */

import { computeQuantitativeConvictions } from "../conviction/quantitativeConvictions.js";
const STORAGE_KEY = "jupiter:dca:executions";
const POLYGON_KEY = process.env.POLYGON_API_KEY || process.env.VITE_POLYGON_API_KEY || 'YnaWTNmcXAkNMDpZTrFqpeLbvxisYOc3';

// CAGR assumptions (monthly equivalent)
const CAGR_BY_SYMBOL = {
  // Auto-fallback: any symbol not listed defaults to 20%
  PLTR: 45, RKLB: 38, APP: 40, AVGO: 30, NVDA: 28, NU: 28,
  AXON: 25, MELI: 25, LLY: 23, NOW: 22, ZETA: 21, BTC: 20,
  ASML: 15, ETH: 15, MSTR: 18,
};

function monthlyDriftFromCAGR(cagr) {
  // Annual CAGR → monthly expected return
  // e.g., 38% annual = (1.38 ^ (1/12) - 1) = ~2.72% monthly
  return (Math.pow(1 + cagr / 100, 1 / 12) - 1) * 100;
}

/**
 * Fetch live price from Polygon API
 * @param {String} symbol - ticker (PLTR, BTC, etc.)
 * @returns {Promise<Number>} - closing price or null if fetch fails
 */
export async function fetchLivePrice(symbol) {
  try {
    const isCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
    let url;

    if (isCrypto) {
      const ticker = `X:${symbol.toUpperCase()}USD`;
      url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    } else {
      url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    }

    const resp = await fetch(url, { timeout: 5000 });
    if (!resp.ok) {
      console.warn(`[DCA AUDIT] Price fetch failed for ${symbol}: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const closePrice = data?.results?.[0]?.c;
    
    if (!closePrice) {
      console.warn(`[DCA AUDIT] No price data for ${symbol}`);
      return null;
    }

    console.log(`[DCA AUDIT] Fetched ${symbol}: $${closePrice}`);
    return closePrice;
  } catch (err) {
    console.error(`[DCA AUDIT] fetchLivePrice(${symbol}) failed:`, err);
    return null;
  }
}

/**
 * Fetch prices for multiple symbols in parallel
 * @param {Array<String>} symbols
 * @returns {Promise<Object>} - { PLTR: 48.91, RKLB: 22.15, ... }
 */
export async function fetchLivePrices(symbols) {
  const results = {};
  
  const promises = symbols.map(async (symbol) => {
    const price = await fetchLivePrice(symbol);
    if (price) results[symbol] = price;
  });

  await Promise.all(promises);
  return results;
}

/**
 * Log a single DCA allocation with live entry price
 * @param {Object} allocation - { symbol, amount }
 * @returns {Promise<Object>} - execution record with entry price fetched
 */
export async function logDCAExecutionWithPrice(allocation) {
  try {
    const executions = loadExecutions();
    
    // Fetch live entry price
    const entryPrice = await fetchLivePrice(allocation.symbol);
    if (!entryPrice) {
      console.warn(`[DCA AUDIT] Failed to fetch price for ${allocation.symbol}, using placeholder`);
    }

    // Fetch conviction at execution time (derived from live market data)
    const convictionResults = await computeQuantitativeConvictions([allocation.symbol.toUpperCase()]);
    const convictionAtExecution = convictionResults[allocation.symbol.toUpperCase()]?.conviction || 0.5;

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const record = {
      id,
      timestamp: allocation.timestamp || Date.now(),
      symbol: allocation.symbol.toUpperCase(),
      amount: Number(allocation.amount),
      entryPrice: entryPrice || null,
      entryPriceFetchedAt: entryPrice ? Date.now() : null,
      convictionAtExecution: Number(convictionAtExecution.toFixed(2)),
      cagr: CAGR_BY_SYMBOL[allocation.symbol.toUpperCase()] || 20,
      expectedMonthlyDrift: monthlyDriftFromCAGR(CAGR_BY_SYMBOL[allocation.symbol.toUpperCase()] || 20),
      currentPrice: null,
      actualReturnPct: null,
      driftStatus: null,
      lastUpdated: Date.now(),
    };
    
    executions.push(record);
    
    return record;
  } catch (err) {
    console.error('[DCA AUDIT] logDCAExecutionWithPrice failed:', err);
    throw err;
  }
}
/**
 * Log batch DCA execution with live prices
 * @param {Array} allocations - [{ symbol, amount }, ...]
 * @returns {Promise<Array>} - execution records
 */
export async function logBatchDCAExecutionWithPrices(allocations) {
  const records = await Promise.all(
    allocations.map(a => logDCAExecutionWithPrice(a))
  );
  const executions = loadExecutions();
  records.forEach(record => executions.push(record));
  saveExecutions(executions);
  return records;
}
}

/**
 * Update current prices and recalculate drift for all executions
 * Fetches live prices from Polygon
 */
export async function updateExecutionPricesLive() {
  try {
    const executions = loadExecutions();
    
    // Get unique symbols
    const symbols = [...new Set(executions.map(e => e.symbol))];
    
    // Fetch all prices at once
    const priceMap = await fetchLivePrices(symbols);
    
    executions.forEach(exec => {
      if (priceMap[exec.symbol]) {
        exec.currentPrice = priceMap[exec.symbol];
        
        // Calculate actual return (only if we have entry price)
        if (exec.entryPrice) {
          const actualReturn = ((exec.currentPrice - exec.entryPrice) / exec.entryPrice) * 100;
          exec.actualReturnPct = actualReturn;
          
          // Days held
          const daysHeld = (Date.now() - exec.timestamp) / (1000 * 60 * 60 * 24);
          const monthsHeld = daysHeld / 30;
          
          // Expected return over actual holding period
          const expectedReturn = (Math.pow(1 + exec.expectedMonthlyDrift / 100, monthsHeld) - 1) * 100;
          
          // Determine status
          if (monthsHeld < 0.5) {
            exec.driftStatus = "TOO_EARLY"; // Less than 2 weeks
          } else if (actualReturn >= expectedReturn * 0.95) {
            exec.driftStatus = "BEATING"; // Within 5% of expected (accounting for variance)
          } else if (actualReturn >= expectedReturn * 0.80) {
            exec.driftStatus = "ON_TRACK";
          } else {
            exec.driftStatus = "LAGGING";
          }
        } else {
          exec.driftStatus = "NO_ENTRY_PRICE"; // Entry price fetch failed
        }
        
        exec.lastUpdated = Date.now();
      }
    });
    
    saveExecutions(executions);
    return executions;
  } catch (err) {
    console.error('[DCA AUDIT] updateExecutionPricesLive failed:', err);
    throw err;
  }
}

/**
 * Get all executions with optional filtering
 * @param {Object} filter - { symbol?, startDate?, endDate?, status? }
 */
export function getExecutions(filter = {}) {
  const executions = loadExecutions();
  
  return executions.filter(exec => {
    if (filter.symbol && exec.symbol !== filter.symbol.toUpperCase()) return false;
    if (filter.startDate && exec.timestamp < filter.startDate) return false;
    if (filter.endDate && exec.timestamp > filter.endDate) return false;
    if (filter.status && exec.driftStatus !== filter.status) return false;
    return true;
  });
}

/**
 * Get execution by ID
 */
export function getExecutionById(id) {
  const executions = loadExecutions();
  return executions.find(e => e.id === id);
}

/**
 * Group executions by date (for viewing "this month's DCA")
 */
export function groupExecutionsByDate() {
  const executions = loadExecutions();
  const grouped = {};
  
  executions.forEach(exec => {
    const date = new Date(exec.timestamp).toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(exec);
  });
  
  return grouped;
}

/**
 * Calculate aggregate stats for a date or all-time
 * @param {Number} timestamp - optional; if omitted, all-time
 */
export function calculateAuditStats(timestamp = null) {
  let executions = loadExecutions();
  
  if (timestamp) {
    const dateStr = new Date(timestamp).toISOString().split('T')[0];
    executions = executions.filter(e => 
      new Date(e.timestamp).toISOString().split('T')[0] === dateStr
    );
  }
  
  if (executions.length === 0) {
    return {
      totalExecutions: 0,
      totalInvested: 0,
      currentValue: 0,
      aggregateReturnPct: 0,
      averageExpectedDrift: 0,
      driftBeatingCount: 0,
      driftOnTrackCount: 0,
      driftLaggingCount: 0,
      executions: [],
    };
  }
  
  const totalInvested = executions.reduce((s, e) => s + e.amount, 0);
  const currentValue = executions.reduce((s, e) => {
    if (!e.currentPrice || !e.entryPrice) return s;
    return s + (e.amount / e.entryPrice) * e.currentPrice;
  }, 0);
  const aggregateReturn = currentValue - totalInvested;
  const aggregateReturnPct = totalInvested > 0 ? (aggregateReturn / totalInvested) * 100 : 0;
  
  const avgExpectedDrift = executions.reduce((s, e) => s + e.expectedMonthlyDrift, 0) / executions.length;
  
  const statuses = executions.reduce((acc, e) => {
    if (e.driftStatus === "BEATING") acc.beating++;
    else if (e.driftStatus === "ON_TRACK") acc.onTrack++;
    else if (e.driftStatus === "LAGGING") acc.lagging++;
    return acc;
  }, { beating: 0, onTrack: 0, lagging: 0 });
  
  return {
    totalExecutions: executions.length,
    totalInvested,
    currentValue,
    aggregateReturnPct,
    averageExpectedDrift: avgExpectedDrift,
    driftBeatingCount: statuses.beating,
    driftOnTrackCount: statuses.onTrack,
    driftLaggingCount: statuses.lagging,
    executions,
  };
}

/**
 * Delete an execution record
 */
export function deleteExecution(id) {
  try {
    const executions = loadExecutions();
    const filtered = executions.filter(e => e.id !== id);
    saveExecutions(filtered);
  } catch (err) {
    console.error('[DCA AUDIT] deleteExecution failed:', err);
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

function loadExecutions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[DCA AUDIT] loadExecutions failed:', err);
    return [];
  }
}

function saveExecutions(executions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(executions));
  } catch (err) {
    console.error('[DCA AUDIT] saveExecutions failed:', err);
  }
}
