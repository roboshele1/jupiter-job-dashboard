/**
 * engine/scanner/alertGenerator.js
 * Contextual Alert Generator — Detects signal changes and delivers alerts
 * 
 * Responsibility: Process scan results → detect changes → generate messages → deliver to macOS + Discord
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __scanner_dirname = path.dirname(fileURLToPath(import.meta.url));
const ALERTS_JSON = path.resolve(__scanner_dirname, '../data/alerts.json');
const DECISION_LEDGER = path.resolve(__scanner_dirname, '../snapshots/decision_ledger.json');

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function generateAlertId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substr(2, 5);
  return `alert_${ts}_${rand}`;
}

function getAlertSeverity(oldSignal, newSignal) {
  // EXIT changes are HIGH severity
  if (newSignal === 'EXIT_OR_AVOID') return 'HIGH';
  if (oldSignal === 'HOLD' && newSignal === 'TRIM') return 'MEDIUM';
  if (oldSignal === 'HOLD' && newSignal === 'ADD') return 'MEDIUM';
  if (oldSignal === null) return 'LOW'; // New position
  return 'LOW';
}

function loadLastAction(ticker) {
  try {
    if (!fs.existsSync(DECISION_LEDGER)) return null;
    const raw = fs.readFileSync(DECISION_LEDGER, 'utf-8');
    const ledger = JSON.parse(raw);
    
    // Find most recent action for this ticker
    const actions = ledger.filter(entry => {
      return entry.type === 'DECISION' && entry.ticker === ticker;
    });
    
    if (actions.length === 0) return null;
    
    const latest = actions[actions.length - 1];
    return {
      date: latest.timestamp,
      type: latest.action || 'UNKNOWN'
    };
  } catch (err) {
    console.error('[AlertGenerator] Error loading decision ledger:', err.message);
    return null;
  }
}

function loadAlerts(count = 100) {
  try {
    if (!fs.existsSync(ALERTS_JSON)) return [];
    const raw = fs.readFileSync(ALERTS_JSON, 'utf-8');
    const alerts = JSON.parse(raw);
    return Array.isArray(alerts) ? alerts.slice(-count) : [];
  } catch (err) {
    console.error('[AlertGenerator] Error loading alerts:', err.message);
    return [];
  }
}

function appendAlert(alertRecord) {
  try {
    let alerts = loadAlerts(1000); // Load all for append
    alerts.push(alertRecord);
    fs.writeFileSync(ALERTS_JSON, JSON.stringify(alerts, null, 2));
    console.log(`[AlertGenerator] Appended alert ${alertRecord.alertId}`);
    return true;
  } catch (err) {
    console.error('[AlertGenerator] Error appending alert:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// ALERT MESSAGE GENERATION
// ─────────────────────────────────────────────────────────────

function buildAlertMessage(change, holding, scanCount) {
  const { symbol, previousSignal, newSignal } = change;
  const { weight = 0, kellyTarget = 0 } = holding;
  
  const lastAction = loadLastAction(symbol);
  const lastActionStr = lastAction
    ? `${lastAction.date.split('T')[0]}/${lastAction.type}`
    : 'UNKNOWN';
  
  return `[${symbol}] signal changed from ${previousSignal || 'NEW'} to ${newSignal}. Current weight: ${weight.toFixed(2)}%. Target: ${kellyTarget.toFixed(2)}%. This is scan ${scanCount} where this signal has been flagged. Last action on this holding was ${lastActionStr}.`;
}

// ─────────────────────────────────────────────────────────────
// DELIVERY CHANNELS
// ─────────────────────────────────────────────────────────────

/**
 * Send native macOS notification
 * Requires: `osascript` available (standard on macOS)
 */
async function sendMacOSNotification(title, message, subtitle = '') {
  try {
    if (process.platform !== 'darwin') {
      console.log('[AlertGenerator] Skipping macOS notification (not on macOS)');
      return { success: false, reason: 'NOT_MACOS' };
    }
    
    // Use AppleScript to send notification
    const script = `
      display notification "${message.replace(/"/g, '\\"')}" \\
        with title "${title.replace(/"/g, '\\"')}" \\
        subtitle "${subtitle.replace(/"/g, '\\"')}"
    `;
    
    await execPromise(`osascript -e '${script}'`);
    console.log(`[AlertGenerator] macOS notification sent: ${title}`);
    return { success: true };
  } catch (err) {
    console.error('[AlertGenerator] macOS notification failed:', err.message);
    return { success: false, reason: 'FAILED', error: err.message };
  }
}

/**
 * Send Discord webhook notification
 */
async function sendDiscordNotification(ticker, message, severity) {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      console.log('[AlertGenerator] Discord webhook not configured');
      return { success: false, reason: 'NOT_CONFIGURED' };
    }
    
    // Color coding for embed
    const colorMap = {
      HIGH: 16711680,    // Red
      MEDIUM: 16776960,  // Orange/Yellow
      LOW: 9109504       // Gray
    };
    
    const payload = {
      username: 'Jupiter Portfolio Scanner',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=jupiter',
      embeds: [
        {
          title: `🚨 ${ticker} Signal Changed`,
          description: message,
          color: colorMap[severity] || 9109504,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Jupiter Autonomous Scanner'
          }
        }
      ]
    };
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }
    
    console.log(`[AlertGenerator] Discord notification sent: ${ticker}`);
    return { success: true };
  } catch (err) {
    console.error('[AlertGenerator] Discord notification failed:', err.message);
    return { success: false, reason: 'FAILED', error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN ALERT PROCESSING
// ─────────────────────────────────────────────────────────────

/**
 * Process scan results and generate alerts for signal changes
 */
export async function processNewAlerts(scanRecord) {
  try {
    if (!scanRecord || !scanRecord.success || !scanRecord.signalChanges) {
      console.log('[AlertGenerator] No signal changes in scan, skipping alerts');
      return { success: true, alerts: [] };
    }
    
    const { signalChanges, holdings } = scanRecord;
    
    if (signalChanges.length === 0) {
      console.log('[AlertGenerator] No signal changes detected');
      return { success: true, alerts: [] };
    }
    
    console.log(`[AlertGenerator] Processing ${signalChanges.length} signal changes...`);
    
    const generatedAlerts = [];
    
    for (const change of signalChanges) {
      const alertId = generateAlertId();
      const holding = holdings.find(h => h.symbol === change.symbol);
      
      if (!holding) {
        console.warn(`[AlertGenerator] Holding not found for ${change.symbol}, skipping`);
        continue;
      }
      
      // Generate message
      const message = buildAlertMessage(change, holding, change.scanCount);
      const severity = getAlertSeverity(change.previousSignal, change.newSignal);
      
      // Create alert record
      const alertRecord = {
        alertId,
        timestamp: new Date().toISOString(),
        ticker: change.symbol,
        alertType: 'SIGNAL_CHANGE',
        severity,
        message,
        metadata: {
          oldSignal: change.previousSignal,
          newSignal: change.newSignal,
          currentWeight: holding.weight,
          targetWeight: holding.kellyTarget,
          consecutiveScans: change.scanCount,
          lastActionDate: loadLastAction(change.symbol)?.date || null,
          lastActionType: loadLastAction(change.symbol)?.type || null
        },
        deliveryStatus: {
          macOS: 'PENDING',
          discord: 'PENDING',
          inApp: 'PENDING'
        },
        read: false,
        actionTaken: null
      };
      
      // Send to macOS (only if on macOS)
      const macOSResult = await sendMacOSNotification(
        `[${change.symbol}] Signal: ${change.newSignal}`,
        message,
        `Weight: ${holding.weight.toFixed(2)}% (Target: ${holding.kellyTarget.toFixed(2)}%)`
      );
      alertRecord.deliveryStatus.macOS = macOSResult.success ? 'SENT' : 'FAILED';
      
      // Send to Discord
      const discordResult = await sendDiscordNotification(change.symbol, message, severity);
      alertRecord.deliveryStatus.discord = discordResult.success ? 'SENT' : 'FAILED';
      
      // Mark in-app as pending (IPC handler will mark as delivered)
      alertRecord.deliveryStatus.inApp = 'PENDING';
      
      // Append to alerts ledger
      appendAlert(alertRecord);
      generatedAlerts.push(alertRecord);
      
      // Brief delay between notifications
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`[AlertGenerator] Processed ${generatedAlerts.length} alerts`);
    
    return {
      success: true,
      alerts: generatedAlerts,
      error: null
    };
    
  } catch (err) {
    console.error('[AlertGenerator] Alert processing failed:', err.message);
    return {
      success: false,
      alerts: [],
      error: err.message
    };
  }
}

// ─────────────────────────────────────────────────────────────
// IPC / ELECTRON INTEGRATION
// ─────────────────────────────────────────────────────────────

export function getAlerts(options = {}) {
  const { limit = 50, ticker = null, unreadOnly = false } = options;
  
  let alerts = loadAlerts(200);
  
  if (ticker) {
    alerts = alerts.filter(a => a.ticker === ticker);
  }
  
  if (unreadOnly) {
    alerts = alerts.filter(a => !a.read);
  }
  
  return alerts.slice(-limit);
}

export function markAlertRead(alertId) {
  try {
    let alerts = loadAlerts(1000);
    const alert = alerts.find(a => a.alertId === alertId);
    
    if (!alert) {
      return { success: false, error: 'ALERT_NOT_FOUND' };
    }
    
    alert.read = true;
    alert.readAt = new Date().toISOString();
    
    fs.writeFileSync(ALERTS_JSON, JSON.stringify(alerts, null, 2));
    console.log(`[AlertGenerator] Marked alert ${alertId} as read`);
    
    return { success: true };
  } catch (err) {
    console.error('[AlertGenerator] Error marking alert read:', err.message);
    return { success: false, error: err.message };
  }
}

export function getAlertStats() {
  const alerts = loadAlerts(1000);
  const unreadCount = alerts.filter(a => !a.read).length;
  const highSeverityCount = alerts.filter(a => a.severity === 'HIGH' && !a.read).length;
  
  return {
    totalAlerts: alerts.length,
    unreadCount,
    highSeverityUnread: highSeverityCount,
    lastAlertTime: alerts.length > 0 ? alerts[alerts.length - 1].timestamp : null
  };
}
