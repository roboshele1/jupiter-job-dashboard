/**
 * PORTFOLIO_SNAPSHOT_V1
 * Authoritative, deterministic snapshot with totals
 */

export function buildPortfolioSnapshotV1(positions = []) {
  let snapshotValue = 0;
  let liveValue = 0;

  const normalized = positions.map(p => {
    const snap = Number(p.snapshot || 0);
    const live = Number(p.live || 0);

    snapshotValue += snap;
    liveValue += live;

    return {
      symbol: p.symbol,
      qty: p.qty,
      assetClass: p.type,
      snapshot: snap,
      live,
      delta: Number(p.delta || (live - snap)),
      deltaPct: snap > 0 ? ((live - snap) / snap) * 100 : 0
    };
  });

  const delta = liveValue - snapshotValue;
  const deltaPct = snapshotValue > 0 ? (delta / snapshotValue) * 100 : 0;

  return {
    contract: "PORTFOLIO_SNAPSHOT_V1",
    currency: "USD",
    totals: {
      snapshotValue: Number(snapshotValue.toFixed(2)),
      liveValue: Number(liveValue.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      deltaPct: Number(deltaPct.toFixed(2))
    },
    positions: normalized
  };
}

