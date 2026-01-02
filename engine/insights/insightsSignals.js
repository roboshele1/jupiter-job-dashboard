/**
 * INSIGHTS SIGNAL ENGINE — PHASE 1D
 * Deterministic, read-only signal derivation
 */

export function deriveInsightsSignals(snapshot) {
  if (
    !snapshot ||
    !snapshot.totals ||
    !Array.isArray(snapshot.positions)
  ) {
    return {
      available: false,
      reason: "Snapshot incomplete"
    };
  }

  if (snapshot.positions.length === 0) {
    return {
      available: false,
      reason: "No positions available",
      risk: null,
      performance: {
        dailyPL: snapshot.totals.delta ?? 0,
        dailyPLPct: snapshot.totals.deltaPct ?? 0
      }
    };
  }

  const totalValue = snapshot.totals.snapshotValue;
  const positions = snapshot.positions;

  // --- Risk Signals ---
  const largestPosition = positions.reduce(
    (max, p) => (p.snapshotValue > max.snapshotValue ? p : max),
    positions[0]
  );

  const concentrationPct =
    totalValue > 0
      ? (largestPosition.snapshotValue / totalValue) * 100
      : 0;

  const risk = {
    concentrationRisk: concentrationPct > 35,
    largestHolding: largestPosition.symbol,
    concentrationPct
  };

  // --- Performance Signals ---
  const performance = {
    dailyPL: snapshot.totals.delta,
    dailyPLPct: snapshot.totals.deltaPct
  };

  return {
    available: true,
    risk,
    performance
  };
}

