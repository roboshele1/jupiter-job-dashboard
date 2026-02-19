/**
 * Kelly Decisions IPC Handler
 * Convictions are derived from live price math — no hardcoded opinions.
 * Goal: $1M by 2037. CAGR computed dynamically from live portfolio value.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { valuePortfolio } from '../../engine/portfolio/portfolioValuation.js';
import { computeQuantitativeConvictions, neutralConviction } from '../../engine/conviction/quantitativeConvictions.js';

const __kelly_dirname = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_JSON = path.resolve(__kelly_dirname, '../../engine/data/users/default/holdings.json');

function loadHoldings() {
  const raw = fs.readFileSync(HOLDINGS_JSON, 'utf-8');
  const h = JSON.parse(raw);
  if (!Array.isArray(h)) throw new Error('HOLDINGS_FILE_INVALID');
  console.log(`[Kelly] Loaded ${h.length} holdings from holdings.json`);
  return h;
}

// ── Goal constants ──────────────────────────────────────────────────────────
const GOAL_TARGET = 1_000_000;
const GOAL_YEAR   = 2037;

function computeGoalMetrics(portfolioValue) {
  const now             = new Date();
  const goalDate        = new Date(GOAL_YEAR, 0, 1);
  const msRemaining     = goalDate - now;
  const yearsRemaining  = msRemaining / (1000 * 60 * 60 * 24 * 365.25);
  const monthsRemaining = Math.round(yearsRemaining * 12);
  const remaining       = GOAL_TARGET - portfolioValue;
  const progressPct     = Number(((portfolioValue / GOAL_TARGET) * 100).toFixed(2));
  const requiredCAGR    = portfolioValue > 0 && yearsRemaining > 0
    ? Number(((Math.pow(GOAL_TARGET / portfolioValue, 1 / yearsRemaining) - 1) * 100).toFixed(1))
    : 0;

  return {
    target: GOAL_TARGET,
    current: Number(portfolioValue.toFixed(2)),
    remaining: Number(remaining.toFixed(2)),
    progressPct,
    monthsRemaining,
    yearsRemaining: Number(yearsRemaining.toFixed(2)),
    requiredCAGR,
    goalYear: GOAL_YEAR
  };
}

// ── Kelly constants ─────────────────────────────────────────────────────────
const WIN_PROB    = { AVOID: 0.30, HOLD: 0.50, BUY: 0.65, BUY_MORE: 0.75 };
const WIN_LOSS    = { AVOID: 0.5,  HOLD: 1.0,  BUY: 1.5,  BUY_MORE: 2.0  };
const PRIORITY_RANK = { HIGH: 1, MEDIUM: 2, LOW: 3 };

const FRACTIONAL_KELLY = 0.25;
const MAX_POSITION_PCT = 15;
const MAX_HEAT_PCT     = 50;

function kellySize(confidence, convictionScore) {
  const p   = Math.min(0.85, (WIN_PROB[confidence] || 0.5) + (convictionScore || 0) * 0.1);
  const b   = WIN_LOSS[confidence] || 1.0;
  const raw = ((b * p - (1 - p)) / b) * FRACTIONAL_KELLY * 100;
  return { pct: Math.max(0, Math.min(raw, MAX_POSITION_PCT)), winProb: p, winLoss: b };
}

function getPriority(deltaPct, winProb, action, isOverheated) {
  if (isOverheated && (action === 'TRIM' || action === 'EXIT_OR_AVOID')) return 'HIGH';
  if (!isOverheated && Math.abs(deltaPct) > 5 && winProb > 0.65)        return 'HIGH';
  if (Math.abs(deltaPct) > 2)                                            return 'MEDIUM';
  return 'LOW';
}

export function registerKellyDecisionsIpc(ipcMain) {

  ipcMain.handle('decisions:getKellyRecommendations', async () => {
    try {
      // 1. Load live holdings + price data
      const holdings  = loadHoldings();
      const valuation = await valuePortfolio(holdings);
      const positions = valuation.positions || [];

      // 2. Compute quantitative convictions from live price data — no opinions
      const symbols    = positions.map(p => p.symbol);
      const convictions = await computeQuantitativeConvictions(symbols).catch(() => ({}));

      // 3. Portfolio totals
      const totalMarketValue = positions.reduce((s, p) => s + (p.liveValue || 0), 0);
      const totalBookCost    = positions.reduce((s, p) => s + (p.totalCostBasis || 0), 0);
      const totalPL          = totalMarketValue - totalBookCost;
      const totalReturnPct   = totalBookCost > 0 ? (totalPL / totalBookCost) * 100 : 0;

      // 4. Kelly sizing per position — ALL positions, no cap
      let totalHeat = 0;

      const sized = positions.map(pos => {
        const symbol     = pos.symbol;
        const conv       = convictions[symbol] || neutralConviction(symbol);
        const mktValue   = pos.liveValue || 0;
        const currentPct = totalMarketValue > 0 ? (mktValue / totalMarketValue) * 100 : 0;

        const { pct: optimalPct, winProb, winLoss } = kellySize(conv.confidence, conv.conviction);
        const optimalValue = (totalMarketValue * optimalPct) / 100;
        const deltaValue   = optimalValue - mktValue;
        const deltaPct     = optimalPct - currentPct;

        totalHeat += optimalPct * (1 - winProb);

        let action = 'HOLD';
        if (conv.confidence === 'AVOID') {
          action = 'EXIT_OR_AVOID';
        } else if (currentPct < optimalPct * 0.8) {
          action = 'ADD';
        } else if (currentPct > optimalPct * 1.2) {
          action = conv.confidence === 'HOLD' ? 'TRIM_TO_MINIMAL' : 'TRIM';
        }

        return {
          symbol,
          action,
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
          reasoning:      `Kelly (${FRACTIONAL_KELLY * 100}% fractional): ${optimalPct.toFixed(1)}% optimal — ${(winProb*100).toFixed(0)}% win prob, ${winLoss}:1 ratio`,
          currentPrice:   pos.livePrice || 0
        };
      });

      // 5. Heat check
      const isOverheated = totalHeat > MAX_HEAT_PCT;
      const heatStatus   = isOverheated
        ? 'OVERHEATED'
        : totalHeat > MAX_HEAT_PCT * 0.8 ? 'ELEVATED' : 'NORMAL';

      // 6. Build prioritised action list — ALL holdings shown, sorted by priority
      const actions = sized
        .map(p => ({
          ...p,
          priority: getPriority(p.deltaPct, p.winProbability, p.action, isOverheated)
        }))
        .sort((a, b) => (PRIORITY_RANK[a.priority] || 9) - (PRIORITY_RANK[b.priority] || 9));

      // 7. Cash management
      const totalOptimal   = sized.reduce((s, p) => s + p.optimalValue, 0);
      const cashReserve    = totalMarketValue - totalOptimal;
      const cashReservePct = totalMarketValue > 0 ? (cashReserve / totalMarketValue) * 100 : 0;

      // 8. Dynamic goal metrics
      const goal = computeGoalMetrics(totalMarketValue);

      return {
        timestamp:         Date.now(),
        portfolioValue:    Number(totalMarketValue.toFixed(2)),
        totalBookCost:     Number(totalBookCost.toFixed(2)),
        totalUnrealizedPL: Number(totalPL.toFixed(2)),
        totalReturnPct:    Number(totalReturnPct.toFixed(2)),

        goal,

        heatCheck: {
          totalHeat:      Number(totalHeat.toFixed(2)),
          maxAllowedHeat: MAX_HEAT_PCT,
          status:         heatStatus,
          isOverheated,
          recommendation: isOverheated
            ? 'Reduce positions before adding new exposure'
            : 'Portfolio heat within acceptable parameters'
        },

        cashManagement: {
          optimalCashReserve: Number(cashReserve.toFixed(2)),
          optimalCashPct:     Number(cashReservePct.toFixed(2))
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

    } catch (err) {
      console.error('[Kelly IPC] Error:', err);
      throw err;
    }
  });

  console.log('[IPC] Kelly Decisions handler registered (goal: $1M by 2037, dynamic CAGR, quantitative convictions) ✓');
}
