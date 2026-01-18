/**
 * engine/snapshot/portfolioSnapshotV2.js
 * CAD-denominated authoritative snapshot (V2)
 *
 * EXTENDS V1 (ADD-ONLY):
 * - Introduces read-only cost basis metadata
 * - ZERO UI impact
 * - ZERO IPC impact
 * - ZERO valuation math changes
 * - Backward-compatible superset of V1 shape
 */

import { resolvePrices } from "../market/priceResolver.js";
import { runRiskEngineV1 } from "../risk/riskEngineV1.js";
import COST_BASIS_V1 from "../data/costBasis.v1.js";

export async function buildPortfolioSnapshotV2(positions, previousSnapshot = {}) {
  const prices = await resolvePrices(positions);

  let totalSnapshot = 0;
  let totalLive = 0;

  // Precompute total cost basis (known symbols only)
  const costBasisTotals = COST_BASIS_V1?.totals ?? {};
  const totalCostBasis = Object.values(costBasisTotals).reduce(
    (sum, v) => sum + (typeof v === "number" ? v : 0),
    0
  );

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

    const symbolCostBasis =
      typeof costBasisTotals[pos.symbol] === "number"
        ? {
            total: costBasisTotals[pos.symbol],
            source: "costBasis.v1",
            readOnly: true,
          }
        : null;

    return {
      symbol: pos.symbol,
      qty: pos.qty,
      snapshotValue,
      liveValue,
      delta,
      deltaPct,
      currency: "CAD",
      priceSource: priceEntry?.source ?? "unknown",
      costBasis: symbolCostBasis,
    };
  });

  // ─────────────────────────────────────────────
  // SNAPSHOT CORE (UNCHANGED CONTRACT + ADDITIONS)
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
    costBasis: {
      currency: COST_BASIS_V1.currency ?? "CAD",
      total: totalCostBasis,
      source: "costBasis.v1",
      readOnly: true,
    },
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

