/**
 * engine/snapshot/portfolioSnapshot.js
 * CAD-denominated authoritative snapshot
 *
 * ENRICHED (V1):
 * - Risk Engine V1 attached as read-only metadata
 * - ZERO UI impact
 * - ZERO snapshot mutation
 * - Backward-compatible return shape
 */

import { resolvePrices } from "../market/priceResolver.js";
import { runRiskEngineV1 } from "../risk/riskEngineV1.js";

export async function buildPortfolioSnapshot(positions, previousSnapshot = {}) {
  const prices = await resolvePrices(positions);

  let totalSnapshot = 0;
  let totalLive = 0;

  const rows = positions.map((pos) => {
    const priceEntry = prices[pos.symbol];
    const liveValue = (priceEntry?.price ?? 0) * pos.qty;
    const snapshotValue =
      previousSnapshot[pos.symbol]?.snapshotValue ?? 0;

    const delta = liveValue - snapshotValue;
    const deltaPct =
      snapshotValue > 0 ? (delta / snapshotValue) * 100 : 0;

    totalSnapshot += snapshotValue;
    totalLive += liveValue;

    return {
      symbol: pos.symbol,
      qty: pos.qty,
      snapshotValue,
      liveValue,
      delta,
      deltaPct,
      currency: "CAD",
      priceSource: priceEntry?.source ?? "unknown",
    };
  });

  // ─────────────────────────────────────────────
  // SNAPSHOT CORE (UNCHANGED CONTRACT)
  // ─────────────────────────────────────────────
  const snapshot = {
    currency: "CAD",
    totals: {
      snapshot: totalSnapshot,
      live: totalLive,
      delta: totalLive - totalSnapshot,
      deltaPct:
        totalSnapshot > 0
          ? ((totalLive - totalSnapshot) / totalSnapshot) * 100
          : 0,
    },
    rows,
  };

  // ─────────────────────────────────────────────
  // RISK ENGINE V1 — READ-ONLY ENRICHMENT
  // Safe, non-authoritative, non-blocking
  // ─────────────────────────────────────────────
  try {
    const riskOut = runRiskEngineV1({
      asOf: Date.now(),
      portfolio: {
        positions: rows.map((r) => ({
          symbol: r.symbol,
          qty: r.qty,
          value: r.liveValue,
        })),
      },
      decisionOutput: {
        count: 0,
        alerts: [],
      },
    });

    snapshot.riskEngine = {
      engine: riskOut.engine,
      metrics: riskOut.metrics,
      source: riskOut.source,
      readOnly: true,
    };
  } catch {
    snapshot.riskEngine = null;
  }

  return snapshot;
}

