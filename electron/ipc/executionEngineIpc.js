// electron/ipc/executionEngineIpc.js
// Execution layer: automatically executes trim/add trades based on Kelly rebalancing recommendations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_PATH = path.resolve(__dirname, '../../engine/data/users/default/holdings.json');
const EXECUTION_LOG_PATH = path.resolve(__dirname, '../../engine/snapshots/executionLog.json');

function loadHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHoldings(holdings) {
  try {
    fs.writeFileSync(HOLDINGS_PATH, JSON.stringify(holdings, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function loadExecutionLog() {
  try {
    const raw = fs.readFileSync(EXECUTION_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveExecutionLog(log) {
  try {
    fs.writeFileSync(EXECUTION_LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function registerExecutionEngineIpc(ipcMain) {

  // Execute a single trim (sell some shares)
  ipcMain.handle('execution:executeTrim', async (_event, { symbol, sharesToSell, currentPrice, conviction, reason }) => {
    try {
      const holdings = loadHoldings();
      const holding = holdings.find(h => h.symbol === symbol);

      if (!holding) {
        return { ok: false, error: `${symbol} not found in holdings` };
      }

      if (holding.qty < sharesToSell) {
        return { ok: false, error: `Insufficient shares: have ${holding.qty}, trying to sell ${sharesToSell}` };
      }

      // Execute trim
      const saleValue = sharesToSell * currentPrice;
      holding.qty -= sharesToSell;

      // Update cost basis proportionally
      if (holding.qty > 0) {
        const totalShares = parseFloat(holding.qty) + sharesToSell;
        holding.totalCostBasis = (holding.totalCostBasis * holding.qty) / totalShares;
      } else {
        holding.totalCostBasis = 0;
      }

      // Save updated holdings
      saveHoldings(holdings);

      // Log execution
      const log = loadExecutionLog();
      log.push({
        id: `exec_${Date.now()}`,
        timestamp: Date.now(),
        action: 'TRIM',
        symbol,
        sharesToSell: Number(sharesToSell.toFixed(4)),
        sharePrice: Number(currentPrice.toFixed(2)),
        totalValue: Number(saleValue.toFixed(2)),
        conviction: Number(conviction.toFixed(3)),
        reason,
        newQty: Number(holding.qty.toFixed(6)),
        executedAt: new Date().toISOString(),
      });
      saveExecutionLog(log);

      return {
        ok: true,
        message: `TRIM ${symbol}: sold ${sharesToSell.toFixed(4)} shares at $${currentPrice.toFixed(2)} = $${saleValue.toFixed(2)}`,
        execution: log[log.length - 1],
      };
    } catch (err) {
      console.error('[execution:executeTrim] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Execute a single add (buy more shares)
  ipcMain.handle('execution:executeAdd', async (_event, { symbol, sharesToBuy, currentPrice, conviction, reason }) => {
    try {
      const holdings = loadHoldings();
      const holding = holdings.find(h => h.symbol === symbol);

      if (!holding) {
        return { ok: false, error: `${symbol} not found in holdings` };
      }

      // Execute add
      const purchaseValue = sharesToBuy * currentPrice;
      const oldCostBasis = holding.totalCostBasis || 0;
      const newTotalCost = oldCostBasis + purchaseValue;
      const newTotalShares = holding.qty + sharesToBuy;

      holding.qty = newTotalShares;
      holding.totalCostBasis = newTotalCost;

      // Save updated holdings
      saveHoldings(holdings);

      // Log execution
      const log = loadExecutionLog();
      log.push({
        id: `exec_${Date.now()}`,
        timestamp: Date.now(),
        action: 'ADD',
        symbol,
        sharesToBuy: Number(sharesToBuy.toFixed(4)),
        sharePrice: Number(currentPrice.toFixed(2)),
        totalValue: Number(purchaseValue.toFixed(2)),
        conviction: Number(conviction.toFixed(3)),
        reason,
        newQty: Number(holding.qty.toFixed(6)),
        executedAt: new Date().toISOString(),
      });
      saveExecutionLog(log);

      return {
        ok: true,
        message: `ADD ${symbol}: bought ${sharesToBuy.toFixed(4)} shares at $${currentPrice.toFixed(2)} = $${purchaseValue.toFixed(2)}`,
        execution: log[log.length - 1],
      };
    } catch (err) {
      console.error('[execution:executeAdd] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Execute full rebalancing (batch trim/add)
  ipcMain.handle('execution:executeRebalancing', async (_event, { trims, adds }) => {
    try {
      const results = {
        trims: [],
        adds: [],
        totalTrimmedValue: 0,
        totalAddedValue: 0,
        errors: [],
      };

      // Execute all trims first
      for (const trim of trims) {
        const trimResult = await ipcMain._events['execution:executeTrim'][0].listener(null, {
          symbol: trim.symbol,
          sharesToSell: trim.trimShares,
          currentPrice: trim.currentPrice || 1,
          conviction: trim.conviction,
          reason: trim.reason,
        });

        if (trimResult.ok) {
          results.trims.push(trimResult.execution);
          results.totalTrimmedValue += trim.trimAmount;
        } else {
          results.errors.push(`TRIM ${trim.symbol}: ${trimResult.error}`);
        }
      }

      // Execute all adds
      for (const add of adds) {
        const addResult = await ipcMain._events['execution:executeAdd'][0].listener(null, {
          symbol: add.symbol,
          sharesToBuy: add.addShares,
          currentPrice: add.currentPrice || 1,
          conviction: add.conviction,
          reason: add.reason,
        });

        if (addResult.ok) {
          results.adds.push(addResult.execution);
          results.totalAddedValue += add.addAmount;
        } else {
          results.errors.push(`ADD ${add.symbol}: ${addResult.error}`);
        }
      }

      return {
        ok: results.errors.length === 0,
        results,
        message: `Executed ${results.trims.length} trims + ${results.adds.length} adds`,
      };
    } catch (err) {
      console.error('[execution:executeRebalancing] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Get execution history
  ipcMain.handle('execution:getHistory', async (_event) => {
    try {
      const log = loadExecutionLog();
      return { ok: true, executions: log };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Execution Engine handler registered (execution:*) ✓');
}
