/**
 * electron/ipc/scannerIpc.js
 * Scanner IPC Handler — Exposes scanner functions to Electron renderer
 * 
 * Integrates: portfolioScanEngine, alertGenerator, draftDecisionEngine
 * Channels:
 *   scanner:getLatestScans
 *   scanner:getAlerts
 *   scanner:markAlertRead
 *   scanner:getDraftDecisions
 *   scanner:approveDraft
 *   scanner:dismissDraft
 *   scanner:getScanStats
 *   scanner:getAlertStats
 *   scanner:getDraftStats
 */

import {
  runDailyScan,
  getLatestScans,
  getScanById,
  getScanStats
} from '..//scanner/portfolioScanEngine.js';

import {
  getAlerts,
  markAlertRead,
  getAlertStats,
  processNewAlerts
} from '..//scanner/alertGenerator.js';

import {
  getPendingDrafts,
  getAllDrafts,
  getDraftStats,
  approveDraft,
  dismissDraft
} from '..//scanner/draftDecisionEngine.js';

export function registerScannerIpc(ipcMain) {
  console.log('[ScannerIpc] Registering handlers...');
  
  // ─────────────────────────────────────────────────────────────
  // PORTFOLIO SCANS
  // ─────────────────────────────────────────────────────────────
  
  ipcMain.handle('scanner:getLatestScans', async (event, { limit = 10 } = {}) => {
    try {
      const scans = getLatestScans(limit);
      return { success: true, scans };
    } catch (err) {
      console.error('[ScannerIpc] Error getting latest scans:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:getScanById', async (event, scanId) => {
    try {
      const scan = getScanById(scanId);
      return { success: true, scan };
    } catch (err) {
      console.error('[ScannerIpc] Error getting scan:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:getScanStats', async () => {
    try {
      const stats = getScanStats();
      return { success: true, stats };
    } catch (err) {
      console.error('[ScannerIpc] Error getting scan stats:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:runManualScan', async () => {
    try {
      console.log('[ScannerIpc] Manual scan triggered by user');
      const result = await runDailyScan();
      
      if (result.success) {
        // Also process alerts for manual scan
        await processNewAlerts(result.scanRecord);
      }
      
      return result;
    } catch (err) {
      console.error('[ScannerIpc] Error running manual scan:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  // ─────────────────────────────────────────────────────────────
  // ALERTS
  // ─────────────────────────────────────────────────────────────
  
  ipcMain.handle('scanner:getAlerts', async (event, options = {}) => {
    try {
      const alerts = getAlerts(options);
      return { success: true, alerts };
    } catch (err) {
      console.error('[ScannerIpc] Error getting alerts:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:markAlertRead', async (event, alertId) => {
    try {
      const result = markAlertRead(alertId);
      return result;
    } catch (err) {
      console.error('[ScannerIpc] Error marking alert read:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:getAlertStats', async () => {
    try {
      const stats = getAlertStats();
      return { success: true, stats };
    } catch (err) {
      console.error('[ScannerIpc] Error getting alert stats:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  // ─────────────────────────────────────────────────────────────
  // DRAFT DECISIONS
  // ─────────────────────────────────────────────────────────────
  
  ipcMain.handle('scanner:getDraftDecisions', async (event, { status = 'PENDING', limit = 50 } = {}) => {
    try {
      let drafts;
      
      if (status === 'PENDING') {
        drafts = getPendingDrafts();
      } else {
        drafts = getAllDrafts(limit);
        if (status !== 'ALL') {
          drafts = drafts.filter(d => d.status === status);
        }
      }
      
      return { success: true, drafts };
    } catch (err) {
      console.error('[ScannerIpc] Error getting drafts:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:approveDraft', async (event, draftId, executionNotes = '') => {
    try {
      const result = approveDraft(draftId, executionNotes);
      return result;
    } catch (err) {
      console.error('[ScannerIpc] Error approving draft:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:dismissDraft', async (event, draftId, dismissalReason = '') => {
    try {
      const result = dismissDraft(draftId, dismissalReason);
      return result;
    } catch (err) {
      console.error('[ScannerIpc] Error dismissing draft:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('scanner:getDraftStats', async () => {
    try {
      const stats = getDraftStats();
      return { success: true, stats };
    } catch (err) {
      console.error('[ScannerIpc] Error getting draft stats:', err.message);
      return { success: false, error: err.message };
    }
  });
  
  console.log('[ScannerIpc] ✓ All handlers registered');
}
