/**
 * PORTFOLIO TECHNICAL SIGNALS IPC — V2
 *
 * Contract:
 * - Read-only
 * - Engine-only authority
 * - ALWAYS returns per-holding technical analysis
 * - Never silent, never throws for HOLD states
 */

import { buildPortfolioSignalsSnapshot } from "../../engine/portfolioSignals/portfolioSignalsEngine.js";

export function registerPortfolioTechnicalSignalsIpc(ipcMain, getPortfolioSnapshot) {
  ipcMain.handle("portfolio:technicalSignals:getSnapshot", async () => {
    const snapshot = await getPortfolioSnapshot();

    const portfolio = snapshot?.portfolio;
    const marketData = portfolio?.marketData;

    // Graceful diagnostic snapshot if market data is not ready yet
    if (!portfolio || !marketData) {
      return Object.freeze({
        contract: "PORTFOLIO_TECHNICAL_SIGNALS_V1",
        asOf: new Date().toISOString(),
        diagnostic: true,
        note: "Market data not yet available; technical metrics pending.",
        signals: {}
      });
    }

    const {
      prices,
      dailyCloses,
      weeklyCloses,
      volumes
    } = marketData;

    return await buildPortfolioSignalsSnapshot({
      priceBySymbol: prices || {},
      dailyClosesBySymbol: dailyCloses || {},
      weeklyClosesBySymbol: weeklyCloses || {},
      volumesBySymbol: volumes || {},
    });
  });
}
