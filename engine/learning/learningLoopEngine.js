// engine/learning/learningLoopEngine.js
// Feeds Performance outcomes back into Kelly conviction weights
// Kelly adapts based on realized win rates, adjusting future allocations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEARNING_STATE_PATH = path.resolve(__dirname, '../snapshots/learningState.json');
const INVESTMENT_JOURNAL_PATH = path.resolve(__dirname, '../snapshots/investmentJournal.json');

/**
 * Learning Loop
 * 
 * Input: Investment outcomes (from Performance dashboard)
 * Process:
 *   1. Calculate realized win rate for each symbol
 *   2. Compare to Kelly's predicted win rate (conviction)
 *   3. Adjust Kelly weights based on accuracy
 * Output: Updated conviction calibration
 * 
 * Example:
 *   Kelly predicted NVDA: 65% win rate (conviction 0.65)
 *   Actual NVDA: 72% win rate
 *   Learning: Boost NVDA conviction by +0.07
 */

function loadLearningState() {
  try {
    const raw = fs.readFileSync(LEARNING_STATE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      timestamp: Date.now(),
      convictionAdjustments: {},
      symbolStats: {},
      learningHistory: [],
    };
  }
}

function saveLearningState(state) {
  try {
    fs.writeFileSync(LEARNING_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function loadInvestmentJournal() {
  try {
    const raw = fs.readFileSync(INVESTMENT_JOURNAL_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function computeLearningAdjustments() {
  try {
    const journal = loadInvestmentJournal();
    const learningState = loadLearningState();

    if (!journal || journal.length === 0) {
      return {
        ok: true,
        message: 'No investment history yet',
        adjustments: {},
        stats: {},
      };
    }

    // Group investments by symbol
    const bySymbol = {};
    journal.forEach(entry => {
      if (!bySymbol[entry.symbol]) {
        bySymbol[entry.symbol] = [];
      }
      bySymbol[entry.symbol].push(entry);
    });

    // Compute win rate for each symbol
    const adjustments = {};
    const stats = {};

    Object.entries(bySymbol).forEach(([symbol, entries]) => {
      const wins = entries.filter(e => e.gainLoss > 0).length;
      const losses = entries.filter(e => e.gainLoss < 0).length;
      const total = entries.length;

      const realizedWinRate = total > 0 ? wins / total : 0.5;
      const avgReturnPct = entries.reduce((s, e) => s + (e.gainLossPct || 0), 0) / total;
      const avgKellyConviction = entries.reduce((s, e) => s + (e.kellyConviction || 0.5), 0) / total;

      // Adjustment: realized win rate vs predicted conviction
      const convictionDelta = realizedWinRate - avgKellyConviction;
      const adjustment = convictionDelta * 0.3; // Dampen adjustment to avoid over-correction

      adjustments[symbol] = {
        symbol,
        realizedWinRate: Number((realizedWinRate * 100).toFixed(1)),
        predictedWinRate: Number((avgKellyConviction * 100).toFixed(1)),
        convictionDelta: Number((convictionDelta * 100).toFixed(1)),
        suggestedAdjustment: Number(adjustment.toFixed(3)),
        winCount: wins,
        lossCount: losses,
        totalTrades: total,
        avgReturnPct: Number(avgReturnPct.toFixed(2)),
      };

      stats[symbol] = {
        realizedWinRate,
        avgKellyConviction,
        convictionDelta,
      };
    });

    // Log learning event
    learningState.learningHistory.push({
      timestamp: Date.now(),
      adjustments,
      summary: {
        symbolsAnalyzed: Object.keys(adjustments).length,
        avgDeltaPct: Object.values(adjustments).reduce((s, a) => s + a.convictionDelta, 0) / Object.keys(adjustments).length,
        topImprovement: Object.entries(adjustments).sort((a, b) => b[1].convictionDelta - a[1].convictionDelta)[0],
        topDeclination: Object.entries(adjustments).sort((a, b) => a[1].convictionDelta - b[1].convictionDelta)[0],
      },
    });

    // Keep last 12 learning events
    if (learningState.learningHistory.length > 12) {
      learningState.learningHistory = learningState.learningHistory.slice(-12);
    }

    learningState.convictionAdjustments = adjustments;
    learningState.symbolStats = stats;
    learningState.timestamp = Date.now();

    saveLearningState(learningState);

    return {
      ok: true,
      adjustments,
      stats,
      learningHistory: learningState.learningHistory,
      summary: learningState.learningHistory[learningState.learningHistory.length - 1]?.summary || {},
    };
  } catch (err) {
    console.error('[computeLearningAdjustments] Failed:', err.message);
    return { ok: false, error: err.message };
  }
}

export async function getLearningState() {
  try {
    const state = loadLearningState();
    return {
      ok: true,
      state,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function applyLearningToConvictions(currentConvictions) {
  try {
    const learningState = loadLearningState();

    if (!learningState.convictionAdjustments || Object.keys(learningState.convictionAdjustments).length === 0) {
      return currentConvictions;
    }

    // Apply adjustments to current convictions
    const adjustedConvictions = { ...currentConvictions };

    Object.entries(learningState.convictionAdjustments).forEach(([symbol, adj]) => {
      if (adjustedConvictions[symbol]) {
        const currentConviction = adjustedConvictions[symbol].conviction || 0.5;
        const adjustment = adj.suggestedAdjustment || 0;
        const adjustedConviction = Math.max(0.1, Math.min(0.9, currentConviction + adjustment));

        adjustedConvictions[symbol] = {
          ...adjustedConvictions[symbol],
          conviction: Number(adjustedConviction.toFixed(3)),
          learningAdjustment: Number(adjustment.toFixed(3)),
          rationale: `Kelly learned: ${adj.realizedWinRate}% actual vs ${adj.predictedWinRate}% predicted`,
        };
      }
    });

    return adjustedConvictions;
  } catch (err) {
    console.error('[applyLearningToConvictions] Failed:', err.message);
    return currentConvictions;
  }
}

export default {
  computeLearningAdjustments,
  getLearningState,
  applyLearningToConvictions,
};
