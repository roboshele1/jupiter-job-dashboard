// renderer/state/portfolioSnapshotAdapter.js
// V6 canonical adapter — NO UI LOGIC HERE

export function adaptPortfolioSnapshot(raw) {
  if (!raw) return null;

  // Normalize holdings regardless of upstream shape
  const holdings = raw.holdings
    ? raw.holdings
    : raw.positions
    ? raw.positions.map(p => ({
        symbol: p.symbol,
        assetClass: p.assetClass,
        value: p.live ?? p.snapshot ?? 0
      }))
    : [];

  const totalValue =
    raw.totalValue ??
    raw.totals?.liveValue ??
    holdings.reduce((s, h) => s + (h.value || 0), 0);

  return {
    contract: raw.contract,
    timestamp: raw.timestamp ?? Date.now(),
    holdings,
    totalValue
  };
}

