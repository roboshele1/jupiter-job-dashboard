import { ipcMain } from 'electron';
import {
  addPortfolioItem,
  updatePortfolioItem,
  removePortfolioItem,
  getPortfolio,
} from './portfolioService.js'; // adjust path if needed
import { updateCostBasis } from './costBasisService.js'; // adjust path if needed

// --- PORTFOLIO IPC HANDLERS ---

// Add new portfolio item
ipcMain.handle('portfolio:add', async (event, portfolioItem) => {
  const result = await addPortfolioItem(portfolioItem);
  await updateCostBasis(); // recalc cost basis before returning
  return result;
});

// Update existing portfolio item
ipcMain.handle('portfolio:update', async (event, portfolioItem) => {
  const result = await updatePortfolioItem(portfolioItem);
  await updateCostBasis(); // recalc cost basis before returning
  return result;
});

// Remove portfolio item
ipcMain.handle('portfolio:remove', async (event, itemId) => {
  const result = await removePortfolioItem(itemId);
  await updateCostBasis(); // keep cost basis accurate
  return result;
});

// Get full portfolio
ipcMain.handle('portfolio:get', async () => {
  return getPortfolio();
});

console.log('[portfolioIpc] IPC handlers loaded.');o
x
