// electron/ipc/performanceDashboardIpc.js
// Performance tracking: investment P&L, LCPE win rates, goal progress

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { valuePortfolio } from '../../engine/portfolio/portfolioValuation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_PATH = path.resolve(__dirname, '../../engine/snapshots/investmentJournal.json');
const HOLDINGS_PATH = path.resolve(__dirname, '../../engine/data/users/default/holdings.json');

const GOAL_TARGET = 1_000_000;
const GOAL_YEAR = 2037;

function loadJournal() {
  try {
    const raw = fs.readFileSync(JOURNAL_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function registerPerformanceDashboardIpc(ipcMain) {
  
  // Get full performance analysis
  ipcMain.handle('performance:getAnalysis', async (_event) => {
    try {
      const journal = loadJournal();
      const holdings = loadHoldings();
      const valuation = await valuePortfolio(holdings).catch(() => ({ positions: [], totals: { liveValue: 0 } }));
      
      const liveMap = {};
      if (valuation.positions) {
        valuation.positions.forEach(p => {
          liveMap[p.symbol] = { price: p.livePrice || 0, value: p.liveValue || 0 };
        });
      }
      
      // Enrich journal with current prices and P&L
      const enriched = journal.map(entry => {
        const live = liveMap[entry.symbol] || { price: 0, value: 0 };
        const currentValue = entry.shares > 0 ? entry.shares * live.price : 0;
        const gainLoss = currentValue - entry.amount;
        const gainLossPct = entry.amount > 0 ? (gainLoss / entry.amount) * 100 : 0;
        const daysHeld = Math.floor((Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24));
        const annualizedReturn = daysHeld > 0 ? gainLossPct * (365 / daysHeld) : 0;
        
        return {
          ...entry,
          currentPrice: live.price,
          currentValue,
          gainLoss: Number(gainLoss.toFixed(2)),
          gainLossPct: Number(gainLossPct.toFixed(2)),
          daysHeld,
          annualizedReturn: Number(annualizedReturn.toFixed(2)),
          status: gainLoss > 0 ? 'WIN' : gainLoss < 0 ? 'LOSS' : 'NEUTRAL',
        };
      });
      
      // Portfolio metrics
      const portfolioValue = valuation.totals?.liveValue || 0;
      const totalInvested = enriched.reduce((s, e) => s + e.amount, 0);
      const totalCurrentValue = enriched.reduce((s, e) => s + e.currentValue, 0);
      const totalGainLoss = totalCurrentValue - totalInvested;
      const totalReturnPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
      
      // Goal trajectory
      const yearsRemaining = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
      const monthsRemaining = Math.round(yearsRemaining * 12);
      const requiredCAGR = portfolioValue > 0 
        ? (Math.pow(GOAL_TARGET / portfolioValue, 1 / yearsRemaining) - 1) * 100 
        : 0;
      const projectedValue = portfolioValue * Math.pow(1 + requiredCAGR / 100, yearsRemaining);
      const goalProgress = (portfolioValue / GOAL_TARGET) * 100;
      
      // LCPE accuracy tracking
      const withLCPEData = enriched.filter(e => e.lcpeRank !== 999);
      const lcpeWins = withLCPEData.filter(e => e.gainLoss > 0).length;
      const lcpeWinRate = withLCPEData.length > 0 ? (lcpeWins / withLCPEData.length) * 100 : 0;
      
      const top3Entries = enriched.filter(e => e.lcpeRank && e.lcpeRank <= 3);
      const top3WinRate = top3Entries.length > 0 
        ? (top3Entries.filter(e => e.gainLoss > 0).length / top3Entries.length) * 100 
        : 0;
      
      const avgLCPEReturn = withLCPEData.length > 0
        ? withLCPEData.reduce((s, e) => s + e.gainLossPct, 0) / withLCPEData.length
        : 0;
      
      return {
        ok: true,
        investments: enriched,
        summary: {
          totalInvested: Number(totalInvested.toFixed(2)),
          totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
          totalGainLoss: Number(totalGainLoss.toFixed(2)),
          totalReturnPct: Number(totalReturnPct.toFixed(2)),
          averageHoldDays: enriched.length > 0 
            ? Math.round(enriched.reduce((s, e) => s + e.daysHeld, 0) / enriched.length) 
            : 0,
          winCount: enriched.filter(e => e.gainLoss > 0).length,
          lossCount: enriched.filter(e => e.gainLoss < 0).length,
        },
        goalMetrics: {
          currentPortfolioValue: Number(portfolioValue.toFixed(2)),
          goalTarget: GOAL_TARGET,
          goalYear: GOAL_YEAR,
          progressPct: Number(goalProgress.toFixed(2)),
          remaining: Number((GOAL_TARGET - portfolioValue).toFixed(2)),
          yearsRemaining: Number(yearsRemaining.toFixed(2)),
          monthsRemaining,
          requiredCAGR: Number(requiredCAGR.toFixed(2)),
          projectedValue: Number(projectedValue.toFixed(2)),
          onTrack: projectedValue >= GOAL_TARGET,
        },
        lcpeValidation: {
          totalEntries: enriched.length,
          entriesWithLCPEData: withLCPEData.length,
          overallWinRate: Number(lcpeWinRate.toFixed(1)),
          top3WinRate: Number(top3WinRate.toFixed(1)),
          avgReturnPct: Number(avgLCPEReturn.toFixed(2)),
          bestPerformer: enriched.length > 0 
            ? enriched.reduce((best, e) => e.gainLossPct > best.gainLossPct ? e : best)
            : null,
          worstPerformer: enriched.length > 0 
            ? enriched.reduce((worst, e) => e.gainLossPct < worst.gainLossPct ? e : worst)
            : null,
        },
      };
    } catch (err) {
      console.error('[performance:getAnalysis] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Get investment by ID
  ipcMain.handle('performance:getInvestment', async (_event, id) => {
    try {
      const journal = loadJournal();
      const entry = journal.find(e => e.id === id);
      if (!entry) return { ok: false, error: 'Not found' };
      return { ok: true, data: entry };
    } catch (err) {
      console.error('[performance:getInvestment] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Performance Dashboard handler registered (performance:*) ✓');
}
