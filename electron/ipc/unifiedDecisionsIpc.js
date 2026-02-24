// electron/ipc/unifiedDecisionsIpc.js
// Unified decisions IPC — Kelly + LCPE arbitrated through constraint layer.
// decisions:getKellyRecommendations preserved for backward compat (Dashboard/Signals).

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { valuePortfolio }        from '../../engine/portfolio/portfolioValuation.js';
import { computeQuantitativeConvictions, neutralConviction } from '../../engine/conviction/quantitativeConvictions.js';
import { runUnifiedDecisions }   from '../../engine/decision/unifiedDecisionOrchestrator.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_JSON = path.resolve(__dirname, '../../engine/data/users/default/holdings.json');

const GOAL_TARGET = 1_000_000;
const GOAL_YEAR   = 2037;
const WIN_PROB    = { AVOID: 0.30, HOLD: 0.50, BUY: 0.65, BUY_MORE: 0.75 };
const WIN_LOSS    = { AVOID: 0.5,  HOLD: 1.0,  BUY: 1.5,  BUY_MORE: 2.0  };
const FRACTIONAL_KELLY = 0.25;
const MAX_POSITION_PCT = 15;
const MAX_HEAT_PCT     = 50;

function loadHoldings() {
  const raw = fs.readFileSync(HOLDINGS_JSON, 'utf-8');
  const h   = JSON.parse(raw);
  if (!Array.isArray(h)) throw new Error('HOLDINGS_FILE_INVALID');
  return h;
}

function computeGoalMetrics(portfolioValue) {
  const now            = new Date();
  const msRemaining    = new Date(GOAL_YEAR, 0, 1) - now;
  const yearsRemaining = msRemaining / (1000 * 60 * 60 * 24 * 365.25);
  const remaining      = GOAL_TARGET - portfolioValue;
  return {
    target: GOAL_TARGET,
    current: Number(portfolioValue.toFixed(2)),
    remaining: Number(remaining.toFixed(2)),
    progressPct: Number(((portfolioValue / GOAL_TARGET) * 100).toFixed(2)),
    monthsRemaining: Math.round(yearsRemaining * 12),
    yearsRemaining: Number(yearsRemaining.toFixed(2)),
    requiredCAGR: portfolioValue > 0 && yearsRemaining > 0
      ? Number(((Math.pow(GOAL_TARGET / portfolioValue, 1 / yearsRemaining) - 1) * 100).toFixed(1))
      : 0,
    goalYear: GOAL_YEAR
  };
}

function kellySize(confidence, convictionScore) {
  const p   = Math.min(0.85, (WIN_PROB[confidence] || 0.5) + (convictionScore || 0) * 0.1);
  const b   = WIN_LOSS[confidence] || 1.0;
  const raw = ((b * p - (1 - p)) / b) * FRACTIONAL_KELLY * 100;
  return { pct: Math.max(0, Math.min(raw, MAX_POSITION_PCT)), winProb: p, winLoss: b };
}

// Exported so unifiedDecisionOrchestrator can call without going through IPC
export async function computeKellyData(valuation) {
  const positions       = valuation.positions || [];
  const symbols         = positions.map(p => p.symbol);
  const convictions     = await computeQuantitativeConvictions(symbols).catch(() => ({}));
  const totalMarketValue = positions.reduce((s, p) => s + (p.liveValue || 0), 0);
  const totalBookCost    = positions.reduce((s, p) => s + (p.totalCostBasis || 0), 0);
  const totalPL          = totalMarketValue - totalBookCost;

  let totalHeat = 0;
  const sized = positions.map(pos => {
    const conv       = convictions[pos.symbol] || neutralConviction(pos.symbol);
    const mktValue   = pos.liveValue || 0;
    const currentPct = totalMarketValue > 0 ? (mktValue / totalMarketValue) * 100 : 0;
    const { pct: optimalPct, winProb, winLoss } = kellySize(conv.confidence, conv.conviction);
    const optimalValue = (totalMarketValue * optimalPct) / 100;
    const deltaValue   = optimalValue - mktValue;
    const deltaPct     = optimalPct - currentPct;
    totalHeat += optimalPct * (1 - winProb);

    let action = 'HOLD';
    if (conv.confidence === 'AVOID')                  action = 'EXIT_OR_AVOID';
    else if (currentPct < optimalPct * 0.8)           action = 'ADD';
    else if (currentPct > optimalPct * 1.2)           action = conv.confidence === 'HOLD' ? 'TRIM_TO_MINIMAL' : 'TRIM';

    return {
      symbol: pos.symbol, action,
      currentPct:     Number(currentPct.toFixed(2)),
      optimalPct:     Number(optimalPct.toFixed(2)),
      currentValue:   Number(mktValue.toFixed(2)),
      optimalValue:   Number(optimalValue.toFixed(2)),
      deltaValue:     Number(deltaValue.toFixed(2)),
      deltaPct:       Number(deltaPct.toFixed(2)),
      conviction:     conv.confidence,
      winProbability: Number(winProb.toFixed(3)),
      winLossRatio:   winLoss,
      rationale:      conv.rationale,
      reasoning:      `Kelly (${FRACTIONAL_KELLY * 100}% fractional): ${optimalPct.toFixed(1)}% optimal`,
      currentPrice:   pos.livePrice || 0,
    };
  });

  const isOverheated = totalHeat > MAX_HEAT_PCT;
  const heatStatus   = isOverheated ? 'OVERHEATED' : totalHeat > MAX_HEAT_PCT * 0.8 ? 'ELEVATED' : 'NORMAL';
  const PRIORITY_RANK = { HIGH: 1, MEDIUM: 2, LOW: 3 };

  function getPriority(deltaPct, winProb, action) {
    if (isOverheated && (action === 'TRIM' || action === 'EXIT_OR_AVOID')) return 'HIGH';
    if (!isOverheated && Math.abs(deltaPct) > 5 && winProb > 0.65)        return 'HIGH';
    if (Math.abs(deltaPct) > 2)                                            return 'MEDIUM';
    return 'LOW';
  }

  const actions = sized
    .map(p => ({ ...p, priority: getPriority(p.deltaPct, p.winProbability, p.action) }))
    .sort((a, b) => (PRIORITY_RANK[a.priority] || 9) - (PRIORITY_RANK[b.priority] || 9));

  const totalOptimal   = sized.reduce((s, p) => s + p.optimalValue, 0);
  const cashReserve    = totalMarketValue - totalOptimal;

  return {
    timestamp:         Date.now(),
    portfolioValue:    Number(totalMarketValue.toFixed(2)),
    totalBookCost:     Number(totalBookCost.toFixed(2)),
    totalUnrealizedPL: Number(totalPL.toFixed(2)),
    totalReturnPct:    totalBookCost > 0 ? Number(((totalPL / totalBookCost) * 100).toFixed(2)) : 0,
    goal:              computeGoalMetrics(totalMarketValue),
    heatCheck: {
      totalHeat:      Number(totalHeat.toFixed(2)),
      maxAllowedHeat: MAX_HEAT_PCT,
      status:         heatStatus,
      isOverheated,
      recommendation: isOverheated ? 'Reduce positions before adding new exposure' : 'Portfolio heat within acceptable parameters'
    },
    cashManagement: {
      optimalCashReserve: Number(cashReserve.toFixed(2)),
      optimalCashPct:     totalMarketValue > 0 ? Number(((cashReserve / totalMarketValue) * 100).toFixed(2)) : 0
    },
    actions,
    summary: {
      totalActions: actions.length,
      numAdds:      actions.filter(a => a.action === 'ADD').length,
      numTrims:     actions.filter(a => a.action === 'TRIM' || a.action === 'TRIM_TO_MINIMAL').length,
      numExits:     actions.filter(a => a.action === 'EXIT_OR_AVOID').length,
      highPriority: actions.filter(a => a.priority === 'HIGH').length
    }
  };
}

export function registerUnifiedDecisionsIpc(ipcMain) {
  ipcMain.handle('decisions:getUnifiedDecisions', async () => {
    const holdings    = loadHoldings();
    const valuation   = await valuePortfolio(holdings);
    const kellyData   = await computeKellyData(valuation);

    // Discovery optional — graceful if unavailable
    let discoveryResults = null;
    try {
      const { runDiscoveryScan } = await import('../../engine/discovery/runDiscoveryScan.js');
      discoveryResults = await runDiscoveryScan();
    } catch { /* discovery not required */ }

    // Market regime optional
    let marketRegime = 'NEUTRAL';
    try {
      const { getMarketRegime } = await import('../../engine/market/marketIntelligence.js');
      marketRegime = await getMarketRegime() ?? 'NEUTRAL';
    } catch { /* default neutral */ }

    return runUnifiedDecisions({
      kellyResults:       kellyData,
      discoveryResults,
      marketRegime,
      portfolioPositions: valuation.positions,
    });
  });

  console.log('[IPC] Unified Decisions handler registered (decisions:getUnifiedDecisions) ✓');
}
