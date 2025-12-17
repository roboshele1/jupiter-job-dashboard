/**
 * JUPITER v1 — Allocation Engine
 * Computes allocation bands deterministically from canonical totals.
 * No UI assumptions. No side effects.
 */

const TARGETS = {
  CRYPTO: { target: 0.4, min: 0.3, max: 0.5 },
  EQUITY: { target: 0.6, min: 0.5, max: 0.7 }
};

function computeAllocation(positions, totalValue) {
  const buckets = {
    CRYPTO: 0,
    EQUITY: 0
  };

  for (const p of positions) {
    if (buckets[p.assetClass] !== undefined) {
      buckets[p.assetClass] += p.marketValue;
    }
  }

  return {
    bands: Object.keys(buckets).map(assetClass => {
      const currentPct =
        totalValue > 0 ? buckets[assetClass] / totalValue : 0;

      const { target, min, max } = TARGETS[assetClass];

      let status = "IN_BAND";
      if (currentPct < min) status = "UNDER";
      if (currentPct > max) status = "OVER";

      return {
        assetClass,
        currentPct,
        targetPct: target,
        minPct: min,
        maxPct: max,
        status,
        deltaPct: currentPct - target
      };
    })
  };
}

module.exports = {
  computeAllocation
};

