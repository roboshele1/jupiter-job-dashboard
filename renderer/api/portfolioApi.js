/**
 * renderer/api/portfolioApi.js
 * Renderer → IPC portfolio snapshot
 */

export async function fetchPortfolioSnapshot(positions, previousSnapshot) {
  return await window.portfolio.getSnapshot(
    positions,
    previousSnapshot
  );
}

