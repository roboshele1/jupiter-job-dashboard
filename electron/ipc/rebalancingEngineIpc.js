// electron/ipc/rebalancingEngineIpc.js
// Quarterly rebalancing: trim overweight, add underweight based on Kelly conviction math

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { valuePortfolio } from '../../engine/portfolio/portfolioValuation.js';
import computeKellyOptimalAllocations from '../../engine/allocation/kellyAllocationOptimizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_PATH = path.resolve(__dirname, '../../engine/data/users/default/holdings.json');

const HARD_CAP = 15;

function loadHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function registerRebalancingEngineIpc(ipcMain) {
  
  // Get rebalancing recommendations (Kelly-driven)
  ipcMain.handle('rebalancing:getRecommendations', async (_event) => {
    try {
      const holdings = loadHoldings();
      const valuation = await valuePortfolio(holdings).catch(() => ({ positions: [], totals: { liveValue: 0 } }));
      
      if (!valuation.positions || valuation.positions.length === 0) {
        return { ok: false, error: 'No positions' };
      }

      const totalValue = valuation.totals?.liveValue || 0;
      if (totalValue <= 0) {
        return { ok: false, error: 'Portfolio value invalid' };
      }

      // Get Kelly-optimal allocations from live conviction
      const symbols = valuation.positions.map(p => p.symbol);
      const kellyAllocations = await computeKellyOptimalAllocations(symbols).catch(() => {
        // Fallback: equal weight
        return Object.fromEntries(symbols.map(s => [s, { optimalPct: 100 / symbols.length }]));
      });

      // Compute current allocations and drift
      const positions = valuation.positions.map(p => {
        const currentPct = (p.liveValue / totalValue) * 100;
        const targetPct = kellyAllocations[p.symbol]?.optimalPct || (100 / symbols.length);
        const driftPct = currentPct - targetPct;
        const driftValue = p.liveValue - (totalValue * targetPct / 100);

        return {
          symbol: p.symbol,
          currentValue: Number(p.liveValue.toFixed(2)),
          currentPct: Number(currentPct.toFixed(2)),
          targetPct: Number(targetPct.toFixed(2)),
          driftPct: Number(driftPct.toFixed(2)),
          driftValue: Number(driftValue.toFixed(2)),
          conviction: kellyAllocations[p.symbol]?.conviction || 0.5,
          isOverCap: currentPct > HARD_CAP,
          isUnderTarget: currentPct < targetPct * 0.8,
          livePrice: p.livePrice || 0,
          qty: p.qty || 0,
        };
      });

      // Identify trims (overweight) and adds (underweight)
      const trims = positions
        .filter(p => p.isOverCap || (p.driftPct > 2 && p.currentPct > p.targetPct))
        .sort((a, b) => b.driftValue - a.driftValue);

      const adds = positions
        .filter(p => p.isUnderTarget || (p.driftPct < -2 && p.currentPct < p.targetPct))
        .sort((a, b) => a.driftValue - b.driftValue);

      // Compute trim amounts
      const trimRecommendations = trims.map(p => {
        const targetValue = totalValue * p.targetPct / 100;
        const trimAmount = Math.max(0, p.currentValue - targetValue);
        const trimShares = p.livePrice > 0 ? trimAmount / p.livePrice : 0;

        return {
          symbol: p.symbol,
          action: 'TRIM',
          currentValue: p.currentValue,
          targetValue: Number(targetValue.toFixed(2)),
          trimAmount: Number(trimAmount.toFixed(2)),
          trimShares: Number(trimShares.toFixed(4)),
          currentPct: p.currentPct,
          targetPct: p.targetPct,
          conviction: p.conviction,
          reason: p.isOverCap ? `At hard cap (${HARD_CAP}%)` : `Overweight by ${p.driftPct.toFixed(1)}%`,
        };
      });

      // Compute add amounts
      const addRecommendations = adds.map(p => {
        const targetValue = totalValue * p.targetPct / 100;
        const addAmount = Math.max(0, targetValue - p.currentValue);
        const addShares = p.livePrice > 0 ? addAmount / p.livePrice : 0;

        return {
          symbol: p.symbol,
          action: 'ADD',
          currentValue: p.currentValue,
          targetValue: Number(targetValue.toFixed(2)),
          addAmount: Number(addAmount.toFixed(2)),
          addShares: Number(addShares.toFixed(4)),
          currentPct: p.currentPct,
          targetPct: p.targetPct,
          conviction: p.conviction,
          reason: `Underweight by ${Math.abs(p.driftPct).toFixed(1)}% · Conviction: ${(p.conviction * 100).toFixed(0)}/100`,
        };
      });

      // Cash available from trims
      const totalTrimAmount = trimRecommendations.reduce((s, t) => s + t.trimAmount, 0);
      const totalAddAmount = addRecommendations.reduce((s, a) => s + a.addAmount, 0);
      const cashNeeded = Math.max(0, totalAddAmount - totalTrimAmount);

      // Summary metrics
      const driftScore = positions.reduce((s, p) => s + Math.abs(p.driftPct), 0) / positions.length;
      const isRebalanceNeeded = trims.length > 0 || adds.length > 0;

      return {
        ok: true,
        timestamp: Date.now(),
        portfolioValue: Number(totalValue.toFixed(2)),
        positions: positions.sort((a, b) => b.currentValue - a.currentValue),
        recommendations: {
          trims: trimRecommendations,
          adds: addRecommendations,
          totalTrimAmount: Number(totalTrimAmount.toFixed(2)),
          totalAddAmount: Number(totalAddAmount.toFixed(2)),
          cashNeeded: Number(cashNeeded.toFixed(2)),
        },
        metrics: {
          averageDriftPct: Number(driftScore.toFixed(2)),
          positionsOverCap: trims.length,
          positionsUnderTarget: adds.length,
          isRebalanceNeeded,
          estimatedTimeToRebalance: isRebalanceNeeded ? '< 1 hour of trading' : 'Already balanced',
        },
        kellyData: kellyAllocations,
      };
    } catch (err) {
      console.error('[rebalancing:getRecommendations] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Rebalancing Engine (Kelly-driven) registered ✓');
}
