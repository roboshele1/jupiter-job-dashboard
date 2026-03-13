/**
 * convictionCalibration.js
 * Audits decision quality by grouping past decisions by conviction level
 * Calculates avg return + hit rate per conviction bucket
 * 
 * Data structure flows from decision ledger → execution records → returns
 * Populates as you execute LCPE-ranked decisions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DECISION_LEDGER_PATH = path.resolve(__dirname, '../snapshots/decision_ledger.json');
const EXECUTION_RECORDS_PATH = path.resolve(__dirname, '../snapshots/execution_records.json');

function loadDecisionLedger() {
  try {
    const raw = fs.readFileSync(DECISION_LEDGER_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function loadExecutionRecords() {
  try {
    const raw = fs.readFileSync(EXECUTION_RECORDS_PATH, 'utf-8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

/**
 * Group conviction score into bucket
 * Returns: '80+' | '60-80' | '40-60' | '<40'
 */
function convictionBucket(convictionScore) {
  const score = (convictionScore || 0.5) * 100;
  if (score >= 80) return '80+';
  if (score >= 60) return '60-80';
  if (score >= 40) return '40-60';
  return '<40';
}

/**
 * Calculate conviction calibration metrics
 * Groups decisions by conviction level, calculates return + hit rate
 */
export function calculateConvictionCalibration() {
  const ledger = loadDecisionLedger();
  const executions = loadExecutionRecords();

  // Initialize buckets
  const buckets = {
    '80+': { avgReturn: null, hitRate: null, count: 0, returns: [] },
    '60-80': { avgReturn: null, hitRate: null, count: 0, returns: [] },
    '40-60': { avgReturn: null, hitRate: null, count: 0, returns: [] },
    '<40': { avgReturn: null, hitRate: null, count: 0, returns: [] },
  };

  // Group decisions by conviction + find matching executions
  ledger.forEach(decision => {
    const bucket = convictionBucket(decision.conviction);
    buckets[bucket].count++;

    // Try to find execution record for this decision
    const execution = executions.find(
      e => e.symbol === decision.symbol && 
          e.timestamp >= decision.timestamp &&
          e.timestamp <= decision.timestamp + 30 * 24 * 60 * 60 * 1000 // Within 30 days
    );

    if (execution && execution.returnPct !== undefined) {
      buckets[bucket].returns.push(execution.returnPct);
    }
  });

  // Calculate averages
  Object.entries(buckets).forEach(([bucketKey, bucket]) => {
    if (bucket.returns.length > 0) {
      bucket.avgReturn = bucket.returns.reduce((a, b) => a + b, 0) / bucket.returns.length;
      bucket.hitRate = (bucket.returns.filter(r => r >= 0).length / bucket.returns.length) * 100;
    }
  });

  return buckets;
}

export default calculateConvictionCalibration;
