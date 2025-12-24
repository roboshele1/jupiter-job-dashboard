/**
 * engine/ipc/portfolioSnapshotService.js
 * IPC-safe portfolio snapshot entrypoint
 */

import { buildPortfolioSnapshot } from "../snapshot/portfolioSnapshot.js";

export async function getPortfolioSnapshot(positions, previousSnapshot = {}) {
  return await buildPortfolioSnapshot(positions, previousSnapshot);
}

