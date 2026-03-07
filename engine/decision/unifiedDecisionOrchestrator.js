// engine/decision/unifiedDecisionOrchestrator.js
// Arbitration layer — single coherent decision per symbol. No contradictions escape.
//
// Precedence rules:
//  1. EXIT_OR_AVOID always wins — never overridden by LCPE rank
//  2. TRIM always overrides ADD for the same symbol
//  3. Portfolio overheated → all ADDs blocked globally
//  4. No Kelly headroom → ADD downgraded to HOLD
//  5. New candidates only admitted if heat budget > 5% and CES >= 0.45
//  6. LCPE rank is tiebreaker within same Kelly action tier

import { computeConstraints } from './constraintEngine.js';
import { rankByLCPE }         from './lcpeRankingEngine.js';

export async function runUnifiedDecisions({
  convictions,
  kellyResults,
  discoveryResults,
  marketRegime,
  portfolioPositions,
}) {
  const constraints = computeConstraints(portfolioPositions, kellyResults);

  // Build candidate pool: held positions + discovery candidates
  const allCandidates = [
    ...portfolioPositions.map(p => ({
      symbol:         p.symbol,
      trajectoryScore: p.trajectoryScore  ?? 0.3,
      conviction:      convictions[p.symbol]?.conviction ?? 0.5,
      momentumScore:   p.momentumScore     ?? 0.3,
      projectedCAGR:   p.projectedCAGR     ?? null,
      isHeld: true,
    })),
    ...((discoveryResults?.canonical ?? []).map(d => ({
      symbol:          d.symbol?.symbol || d.symbol,
      trajectoryScore: d.trajectoryMatch?.score     ?? 0,
      conviction:      d.conviction?.normalized     ?? 0,
      momentumScore:   d.tactical?.score            ?? 0,
      projectedCAGR:   d.trajectoryMatch?.cagrProxy ?? null,
      isHeld: false,
    }))),
  ];

  const lcpeRankings = rankByLCPE(allCandidates, marketRegime);
  const lcpeMap      = new Map(lcpeRankings.map(r => [r.symbol, r]));

  const decisions = [];

  for (const kelly of kellyResults.actions) {
    const sym      = kelly.symbol;
    const lcpe     = lcpeMap.get(sym) ?? { ces: 0, rank: 999 };
    const headroom = constraints.headroom[sym] ?? {};

    // Rule 1: EXIT always wins
    if (kelly.action === 'EXIT_OR_AVOID') {
      decisions.push(resolved(sym, 'EXIT_OR_AVOID', 'HIGH', kelly, lcpe,
        'Kelly: exit signal — LCPE rank suppressed'));
      continue;
    }

    // Rule 2: TRIM overrides any ADD for same symbol
    if (kelly.action === 'TRIM' || kelly.action === 'TRIM_TO_MINIMAL') {
      decisions.push(resolved(sym, kelly.action, kelly.priority, kelly, lcpe,
        `Kelly: trim to ${kelly.optimalPct}% optimal — LCPE rank #${lcpe.rank} noted but overridden`));
      continue;
    }

    // Rules 3 & 4: ADD gated by heat and headroom
    if (kelly.action === 'ADD') {
      if (constraints.buyBlocked) {
        decisions.push(resolved(sym, 'HOLD', 'LOW', kelly, lcpe,
          'ADD blocked: portfolio overheated — reduce heat before adding'));
        continue;
      }
      if (!headroom.canAdd) {
        decisions.push(resolved(sym, 'HOLD', 'LOW', kelly, lcpe,
          'ADD blocked: Kelly headroom exhausted'));
        continue;
      }
      // Valid ADD — LCPE rank sets priority
      const priority = lcpe.rank <= 3 ? 'HIGH' : lcpe.rank <= 7 ? 'MEDIUM' : 'LOW';
      decisions.push(resolved(sym, 'ADD', priority, kelly, lcpe,
        `Kelly ADD confirmed — LCPE rank #${lcpe.rank} (CES ${lcpe.ces})`));
      continue;
    }

    // HOLD: surface with LCPE context
    decisions.push(resolved(sym, 'HOLD', 'LOW', kelly, lcpe,
      `Hold — LCPE rank #${lcpe.rank}`));
  }

  // Rule 5: surface top new discovery candidates if heat budget allows
  if (!constraints.buyBlocked && constraints.heatBudget > 5) {
    const heldSymbols = new Set(portfolioPositions.map(p => p.symbol));
    const topNew = lcpeRankings
      .filter(r => !heldSymbols.has(r.symbol) && r.ces >= 0.45)
      .slice(0, 5);

    for (const candidate of topNew) {
      decisions.push({
        symbol:        candidate.symbol,
        action:        'CONSIDER',
        priority:      candidate.rank <= 2 ? 'HIGH' : 'MEDIUM',
        source:        'LCPE_DISCOVERY',
        rationale:     `New candidate: LCPE rank #${candidate.rank}, CES ${candidate.ces}`,
        kellyContext:  null,
        lcpeContext:   { rank: candidate.rank, ces: candidate.ces, cagr: candidate.cagr },
        isNewPosition: true,
      });
    }
  }

  // Sort: EXIT > TRIM > ADD > CONSIDER > HOLD
  const ORDER = {
    EXIT_OR_AVOID: 0, TRIM_TO_MINIMAL: 1, TRIM: 1,
    ADD: 2, CONSIDER: 3, HOLD: 4
  };
  decisions.sort((a, b) => (ORDER[a.action] ?? 9) - (ORDER[b.action] ?? 9));

  return {
    contract:    'UNIFIED_DECISIONS_V1',
    timestamp:   Date.now(),
    // Preserve all original Kelly fields for backward compat
    portfolioValue:    kellyResults.portfolioValue,
    totalBookCost:     kellyResults.totalBookCost,
    totalUnrealizedPL: kellyResults.totalUnrealizedPL,
    totalReturnPct:    kellyResults.totalReturnPct,
    goal:              kellyResults.goal,
    heatCheck:         kellyResults.heatCheck,
    cashManagement:    kellyResults.cashManagement,
    constraints,
    actions:   decisions,  // replaces kelly actions — same field name for UI compat
    summary:   buildSummary(decisions, constraints),
  };
}

function resolved(symbol, action, priority, kelly, lcpe, rationale) {
  return {
    symbol, action, priority,
    source:   'UNIFIED',
    rationale,
    // All original Kelly fields preserved so existing UI renders without changes
    currentPct:     kelly.currentPct,
    optimalPct:     kelly.optimalPct,
    currentValue:   kelly.currentValue,
    optimalValue:   kelly.optimalValue,
    deltaValue:     kelly.deltaValue,
    deltaPct:       kelly.deltaPct,
    conviction:     kelly.conviction,
    winProbability: kelly.winProbability,
    winLossRatio:   kelly.winLossRatio,
    reasoning:      kelly.reasoning,
    currentPrice:   kelly.currentPrice,
    kellyContext: {
      currentPct:  kelly.currentPct,
      optimalPct:  kelly.optimalPct,
      deltaValue:  kelly.deltaValue,
      conviction:  kelly.conviction,
    },
    lcpeContext: {
      rank: lcpe.rank,
      ces:  lcpe.ces,
      cagr: lcpe.cagr ?? null,
    },
    isNewPosition: false,
  };
}

function buildSummary(decisions, constraints) {
  return {
    totalActions: decisions.length,
    numAdds:      decisions.filter(d => d.action === 'ADD').length,
    numTrims:     decisions.filter(d => d.action === 'TRIM' || d.action === 'TRIM_TO_MINIMAL').length,
    numExits:     decisions.filter(d => d.action === 'EXIT_OR_AVOID').length,
    numConsiders: decisions.filter(d => d.action === 'CONSIDER').length,
    highPriority: decisions.filter(d => d.priority === 'HIGH').length,
    buyBlocked:   constraints.buyBlocked,
    heatBudget:   parseFloat(constraints.heatBudget.toFixed(1)),
  };
}
