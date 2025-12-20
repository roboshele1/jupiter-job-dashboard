export function formatRiskSnapshot(raw) {
  if (!raw || !raw.allocations) {
    return null;
  }

  const equity = Number(raw.allocations.Equity || 0);
  const digital = Number(raw.allocations.Digital || 0);

  return {
    topHoldingPct: Number(raw.topHoldingPct || 0),
    allocations: {
      Equity: equity,
      Digital: digital,
    },
    thresholdBreached: Boolean(raw.thresholdBreached),
    ts: raw.ts || Date.now(),
  };
}

