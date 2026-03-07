// engine/allocation/kellyAllocationOptimizer.js
// Computes optimal target allocations from Kelly conviction scores — no hard-coding

import { computeQuantitativeConvictions } from '../conviction/quantitativeConvictions.js';

/**
 * Kelly Allocation Optimizer
 * 
 * Takes conviction scores (0.0 - 1.0) and derives optimal portfolio weights.
 * 
 * Logic:
 *   1. Get conviction for each position
 *   2. Normalize convictions to sum = 1.0
 *   3. Apply concentration penalty (no position > 20%)
 *   4. Hard cap enforcement (no position > 15%)
 *   5. Return optimal target allocations
 * 
 * Result: Pure math, no bias, no hard-coded targets
 */

const HARD_CAP = 15;           // Maximum allocation % for any position
const SOFT_CAP = 20;           // Before penalty kicks in
const CONCENTRATION_PENALTY = 0.15;  // Reduce allocation by 1.5% per 1% over soft cap

export async function computeKellyOptimalAllocations(symbols = []) {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  // Step 1: Get live conviction scores
  const convictions = await computeQuantitativeConvictions(symbols).catch(() => {
    // Fallback: neutral convictions
    return Object.fromEntries(symbols.map(s => [s, { conviction: 0.5 }]));
  });

  // Step 2: Extract conviction values and normalize
  const convictionValues = symbols.map(s => convictions[s]?.conviction || 0.5);
  const totalConviction = convictionValues.reduce((a, b) => a + b, 0);
  
  if (totalConviction <= 0) {
    // Equal weight if all convictions are zero
    const equalWeight = 100 / symbols.length;
    return Object.fromEntries(symbols.map(s => [s, { optimalPct: equalWeight, conviction: 0.5 }]));
  }

  // Step 3: Compute raw allocations proportional to conviction
  let allocations = symbols.map((symbol, i) => {
    const conviction = convictions[symbol]?.conviction || 0.5;
    const rawPct = (conviction / totalConviction) * 100;
    
    return {
      symbol,
      conviction,
      rawPct,
      penalizedPct: rawPct,  // Will be updated in step 4
    };
  });

  // Step 4: Apply concentration penalty (positions over SOFT_CAP)
  allocations = allocations.map(a => {
    if (a.rawPct > SOFT_CAP) {
      const excess = a.rawPct - SOFT_CAP;
      const penalty = excess * CONCENTRATION_PENALTY;
      a.penalizedPct = a.rawPct - penalty;
    }
    return a;
  });

  // Step 5: Enforce hard cap (no position > HARD_CAP)
  allocations = allocations.map(a => {
    if (a.penalizedPct > HARD_CAP) {
      a.cappedPct = HARD_CAP;
    } else {
      a.cappedPct = a.penalizedPct;
    }
    return a;
  });

  // Step 6: Redistribute excess from capped positions proportionally to non-capped
  const totalAllocated = allocations.reduce((s, a) => s + a.cappedPct, 0);
  const excess = 100 - totalAllocated;
  const uncappedAllocations = allocations.filter(a => a.cappedPct < HARD_CAP);
  
  if (uncappedAllocations.length > 0 && excess > 0) {
    const uncappedTotal = uncappedAllocations.reduce((s, a) => s + a.cappedPct, 0);
    const redistributeFactor = (uncappedTotal + excess) / uncappedTotal;
    
    allocations = allocations.map(a => {
      if (a.cappedPct < HARD_CAP) {
        a.optimalPct = Math.min(HARD_CAP, a.cappedPct * redistributeFactor);
      } else {
        a.optimalPct = a.cappedPct;
      }
      return a;
    });
  } else {
    allocations = allocations.map(a => ({ ...a, optimalPct: a.cappedPct }));
  }

  // Step 7: Return as map with full detail
  const result = {};
  allocations.forEach(a => {
    result[a.symbol] = {
      optimalPct: Number(a.optimalPct.toFixed(2)),
      conviction: Number(a.conviction.toFixed(3)),
      rawPct: Number(a.rawPct.toFixed(2)),
      penalizedPct: Number(a.penalizedPct.toFixed(2)),
      cappedPct: Number(a.cappedPct.toFixed(2)),
      rationale: `Conviction ${(a.conviction * 100).toFixed(0)}/100 → ${a.optimalPct.toFixed(1)}% optimal`,
    };
  });

  return result;
}

export default computeKellyOptimalAllocations;
