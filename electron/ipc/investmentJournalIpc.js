// electron/ipc/investmentJournalIpc.js
// Investment Journal — tracks every DCA execution for performance learning

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_PATH = path.resolve(__dirname, '../../engine/snapshots/investmentJournal.json');

function loadJournal() {
  try {
    const raw = fs.readFileSync(JOURNAL_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveJournal(entries) {
  fs.writeFileSync(JOURNAL_PATH, JSON.stringify(entries, null, 2), 'utf-8');
}

export function registerInvestmentJournalIpc(ipcMain) {
  
  // Record a new investment
  ipcMain.handle('investmentJournal:record', async (_event, payload) => {
    try {
      const journal = loadJournal();
      
      const entry = {
        id: `inv_${Date.now()}`,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        symbol: payload.symbol,
        amount: payload.amount,
        entryPrice: payload.entryPrice,
        shares: payload.shares,
        lcpeRank: payload.lcpeRank,
        lcpeCes: payload.lcpeCes,
        kellyConviction: payload.kellyConviction,
        portfolioValueAtEntry: payload.portfolioValueAtEntry,
        notes: payload.notes || '',
      };
      
      journal.push(entry);
      saveJournal(journal);
      
      console.log(`[investmentJournal:record] Recorded: ${entry.symbol} $${entry.amount}`);
      return { ok: true, id: entry.id, count: journal.length };
    } catch (err) {
      console.error('[investmentJournal:record] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Get all investments
  ipcMain.handle('investmentJournal:getAll', async () => {
    try {
      const journal = loadJournal();
      return { ok: true, data: journal };
    } catch (err) {
      console.error('[investmentJournal:getAll] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Get investment by ID
  ipcMain.handle('investmentJournal:getById', async (_event, id) => {
    try {
      const journal = loadJournal();
      const entry = journal.find(e => e.id === id);
      if (!entry) return { ok: false, error: 'Not found' };
      return { ok: true, data: entry };
    } catch (err) {
      console.error('[investmentJournal:getById] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Update investment (e.g., add exit price, performance notes)
  ipcMain.handle('investmentJournal:update', async (_event, id, updates) => {
    try {
      const journal = loadJournal();
      const idx = journal.findIndex(e => e.id === id);
      if (idx === -1) return { ok: false, error: 'Not found' };
      
      journal[idx] = { ...journal[idx], ...updates, updatedAt: Date.now() };
      saveJournal(journal);
      
      console.log(`[investmentJournal:update] Updated: ${id}`);
      return { ok: true, data: journal[idx] };
    } catch (err) {
      console.error('[investmentJournal:update] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Investment Journal handler registered (investmentJournal:*) ✓');
}
