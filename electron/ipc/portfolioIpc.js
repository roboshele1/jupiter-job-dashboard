/**
 * Portfolio IPC — Mutation Layer
 * Engine-first, disk-backed, deterministic.
 * Book cost is taken directly from user input — no overrides.
 */

import electronPkg from 'electron';
import pathModule from 'path';
import { fileURLToPath } from 'url';

const { ipcMain } = electronPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

const portfolioEngine = await import(
  pathModule.resolve(__dirname, '../../engine/portfolio/portfolioEngine.js')
);

const engine = portfolioEngine?.default || portfolioEngine;
const { getPortfolioSnapshot, addHolding, updateHolding, removeHolding } = engine;

function safeHandle(channel, fn) {
  try { ipcMain.removeHandler(channel); } catch {}
  ipcMain.handle(channel, fn);
}

export function registerPortfolioIpc() {
  safeHandle('portfolio:getSnapshot', async () => {
    return getPortfolioSnapshot();
  });

  safeHandle('portfolio:add', async (_e, payload) => {
    // payload: { symbol, qty, cost } — cost comes directly from user, no override
    if (!payload?.symbol) throw new Error('MISSING_SYMBOL');
    if (!payload?.qty)    throw new Error('MISSING_QTY');
    if (!payload?.cost && payload.cost !== 0) throw new Error('MISSING_COST');
    return addHolding(payload);
  });

  safeHandle('portfolio:update', async (_e, payload) => {
    return updateHolding(payload);
  });

  safeHandle('portfolio:remove', async (_e, payload) => {
    return removeHolding(payload);
  });

  console.log('[IPC] Portfolio mutation layer registered (portfolio:add/update/remove) ✓');
}
