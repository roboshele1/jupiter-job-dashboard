// V1 RISK ENGINE — READ ONLY
// Deterministic, snapshot-based

export function getRiskSnapshot(portfolio) {
  if (!portfolio || !portfolio.holdings) {
    return {
      concentration: {
        topHolding: null,
        top1Pct: 0,
        top3Pct: 0,
        top5Pct: 0,
      },
    };
  }

  const sorted = [...portfolio.holdings].sort(
    (a, b) => b.allocationPct - a.allocationPct
  );

  const sumPct = (n) =>
    sorted.slice(0, n).reduce((acc, h) => acc + h.allocationPct, 0);

  return {
    concentration: {
      topHolding: sorted[0] || null,
      top1Pct: Number(sumPct(1).toFixed(2)),
      top3Pct: Number(sumPct(3).toFixed(2)),
      top5Pct: Number(sumPct(5).toFixed(2)),
    },
  };
}

