/**
 * engine/scanner/daemon.js
 * Jupiter Autonomous Scanner Daemon
 * 
 * Standalone Node.js process that runs independently
 * Executes daily portfolio scans at 4:30 PM ET
 * 
 * Usage: node engine/scanner/daemon.js
 * Deploy with: pm2 start engine/scanner/daemon.js --name jupiter-scanner
 */

import 'dotenv/config';
import cron from 'node-cron';
import { runDailyScan } from './portfolioScanEngine.js';
import { processNewAlerts } from './alertGenerator.js';
import { updateConsecutiveSignalCounts } from './draftDecisionEngine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __daemon_dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.resolve(__daemon_dirname, '../../logs');
const DAEMON_LOG = path.resolve(LOGS_DIR, 'scanner-daemon.log');

// ─────────────────────────────────────────────────────────────
// LOGGING SETUP
// ─────────────────────────────────────────────────────────────

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function logEvent(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logLine = data
    ? `[${timestamp}] [${level}] ${message} | ${JSON.stringify(data)}`
    : `[${timestamp}] [${level}] ${message}`;
  
  console.log(logLine);
  
  // Append to file
  try {
    fs.appendFileSync(DAEMON_LOG, logLine + '\n');
  } catch (err) {
    console.error('Failed to write to daemon log:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// CRON SCHEDULE
// ─────────────────────────────────────────────────────────────

/**
 * ET (Eastern Time) schedule: 4:30 PM every business day (Mon-Fri)
 * Cron format: minute hour day month weekday
 * 30 16 * * 1-5 = 4:30 PM (16:30) Mon-Fri
 * 
 * NOTE: This runs in the process's local timezone.
 * For production, either:
 * 1. Run daemon in ET timezone: TZ=America/New_York node daemon.js
 * 2. Or adjust cron time based on deployment timezone
 */

const SCAN_SCHEDULE = process.env.SCANNER_SCHEDULE || '30 16 * * 1-5';

logEvent('INFO', `🚀 Jupiter Scanner Daemon starting...`);
logEvent('INFO', `Scheduled scan time: ${SCAN_SCHEDULE} (4:30 PM ET, Mon-Fri)`);
logEvent('INFO', `Current timezone: ${process.env.TZ || 'default (UTC)'}`);

// ─────────────────────────────────────────────────────────────
// MAIN SCAN ORCHESTRATION
// ─────────────────────────────────────────────────────────────

/**
 * Execute full scan pipeline:
 * 1. Run portfolio scan
 * 2. Generate alerts for signal changes
 * 3. Update draft decision counters
 */
async function executeScanPipeline() {
  const pipelineStartTime = Date.now();
  
  try {
    logEvent('INFO', '═══════════════════════════════════════════════════════');
    logEvent('INFO', '▶️  STARTING SCAN PIPELINE');
    logEvent('INFO', '═══════════════════════════════════════════════════════');
    
    // ────────────────────────────────────────────────────────────
    // STEP 1: RUN PORTFOLIO SCAN
    // ────────────────────────────────────────────────────────────
    logEvent('INFO', 'Step 1: Running portfolio scan...');
    
    const scanStartTime = Date.now();
    const scanResult = await runDailyScan();
    const scanDuration = Date.now() - scanStartTime;
    
    if (!scanResult.success) {
      logEvent('ERROR', `Portfolio scan FAILED`, {
        error: scanResult.error,
        durationMs: scanDuration
      });
      
      return {
        success: false,
        error: `Scan failed: ${scanResult.error}`,
        durationMs: Date.now() - pipelineStartTime
      };
    }
    
    const { scanRecord, changes } = scanResult;
    
    logEvent('INFO', `✓ Portfolio scan completed`, {
      scanId: scanRecord.scanId,
      holdingsCount: scanRecord.holdings?.length || 0,
      signalChanges: changes.length,
      durationMs: scanDuration
    });
    
    // ────────────────────────────────────────────────────────────
    // STEP 2: GENERATE ALERTS
    // ────────────────────────────────────────────────────────────
    logEvent('INFO', 'Step 2: Processing alerts...');
    
    const alertStartTime = Date.now();
    const alertResult = await processNewAlerts(scanRecord);
    const alertDuration = Date.now() - alertStartTime;
    
    if (!alertResult.success) {
      logEvent('WARN', `Alert processing failed (continuing)`, {
        error: alertResult.error,
        durationMs: alertDuration
      });
    } else {
      logEvent('INFO', `✓ Alerts processed`, {
        alertsGenerated: alertResult.alerts?.length || 0,
        durationMs: alertDuration
      });
      
      alertResult.alerts?.forEach(alert => {
        logEvent('INFO', `  Alert: [${alert.ticker}] ${alert.severity}`, {
          alertId: alert.alertId,
          macOS: alert.deliveryStatus.macOS,
          discord: alert.deliveryStatus.discord
        });
      });
    }
    
    // ────────────────────────────────────────────────────────────
    // STEP 3: UPDATE DRAFT DECISION COUNTERS
    // ────────────────────────────────────────────────────────────
    logEvent('INFO', 'Step 3: Updating draft decision counters...');
    
    const draftStartTime = Date.now();
    const draftResult = updateConsecutiveSignalCounts(scanRecord);
    const draftDuration = Date.now() - draftStartTime;
    
    if (!draftResult.success) {
      logEvent('WARN', `Draft decision processing failed (continuing)`, {
        error: draftResult.error,
        durationMs: draftDuration
      });
    } else {
      logEvent('INFO', `✓ Draft decision counters updated`, {
        autoGeneratedDrafts: draftResult.autoGeneratedDrafts?.length || 0,
        durationMs: draftDuration
      });
      
      draftResult.autoGeneratedDrafts?.forEach(draft => {
        logEvent('INFO', `  Draft: [${draft.ticker}] ${draft.signal} (${draft.consecutiveScans} scans)`, {
          draftId: draft.draftId,
          status: draft.status
        });
      });
    }
    
    // ────────────────────────────────────────────────────────────
    // SUCCESS
    // ────────────────────────────────────────────────────────────
    const totalDuration = Date.now() - pipelineStartTime;
    
    logEvent('INFO', '✅ PIPELINE COMPLETED SUCCESSFULLY', {
      totalDurationMs: totalDuration,
      scanDurationMs: scanDuration,
      alertDurationMs: alertDuration,
      draftDurationMs: draftDuration,
      signalChanges: changes.length,
      alertsGenerated: alertResult.alerts?.length || 0,
      draftsGenerated: draftResult.autoGeneratedDrafts?.length || 0
    });
    
    logEvent('INFO', '═══════════════════════════════════════════════════════');
    
    return {
      success: true,
      scanId: scanRecord.scanId,
      signalChanges: changes.length,
      alertsGenerated: alertResult.alerts?.length || 0,
      draftsGenerated: draftResult.autoGeneratedDrafts?.length || 0,
      durationMs: totalDuration
    };
    
  } catch (err) {
    logEvent('ERROR', `🔴 PIPELINE CRASHED`, {
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join(' | '),
      durationMs: Date.now() - pipelineStartTime
    });
    
    return {
      success: false,
      error: err.message,
      durationMs: Date.now() - pipelineStartTime
    };
  }
}

// ─────────────────────────────────────────────────────────────
// CRON JOB SETUP
// ─────────────────────────────────────────────────────────────

let task = null;

function startScheduler() {
  try {
    task = cron.schedule(SCAN_SCHEDULE, async () => {
      const now = new Date();
      logEvent('INFO', `⏰ Scheduled time reached: ${now.toISOString()}`);
      
      await executeScanPipeline();
    });
    
    logEvent('INFO', `✓ Cron job scheduled: "${SCAN_SCHEDULE}"`);
    return true;
  } catch (err) {
    logEvent('ERROR', `Failed to schedule cron job: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────

function gracefulShutdown(signal) {
  logEvent('INFO', `\n${signal} received. Shutting down gracefully...`);
  
  if (task) {
    task.stop();
    logEvent('INFO', 'Cron task stopped');
  }
  
  logEvent('INFO', 'Jupiter Scanner Daemon stopped');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ─────────────────────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────────────────────

(async () => {
  ensureLogsDir();
  
  logEvent('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logEvent('INFO', 'JUPITER AUTONOMOUS SCANNER DAEMON');
  logEvent('INFO', `Started: ${new Date().toISOString()}`);
  logEvent('INFO', `Node version: ${process.version}`);
  logEvent('INFO', `PID: ${process.pid}`);
  logEvent('INFO', `Environment: ${process.env.NODE_ENV || 'development'}`);
  logEvent('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Start scheduler
  const schedulerStarted = startScheduler();
  
  if (!schedulerStarted) {
    logEvent('ERROR', 'Failed to start scheduler. Exiting.');
    process.exit(1);
  }
  
  // Optional: Run initial scan on startup (for testing)
  if (process.env.SCANNER_RUN_ON_STARTUP === 'true') {
    logEvent('INFO', 'Running initial scan on startup...');
    await executeScanPipeline();
  }
  
  logEvent('INFO', '✅ Jupiter Scanner Daemon is running');
  logEvent('INFO', `   Next scan: 4:30 PM ET (${SCAN_SCHEDULE})`);
  logEvent('INFO', `   Logs: ${DAEMON_LOG}`);
  logEvent('INFO', '');
  logEvent('INFO', 'To stop: Press Ctrl+C or send SIGTERM');
  logEvent('INFO', '');
})();

// Keep process alive
setInterval(() => {
  // No-op keep-alive
}, 1000);
