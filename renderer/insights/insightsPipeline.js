/**
 * INSIGHTS PIPELINE — PHASE 1E
 * Controlled, deterministic renderer mapping layer
 *
 * Engine snapshot → schema-safe Insights object
 */

import { deriveInsightsSignals } from "../../engine/insights/insightsSignals.js";

/**
 * PRIMARY PIPELINE
 * Deterministic, renderer-safe
 */
export async function buildInsightsSnapshotFromSnapshot(snapshot) {
  const now = Date.now();

  // --- Snapshot validation ---
  if (!snapshot || !snapshot.totals) {
    return {
      meta: {
        mode: "observer",
        phase: "1E",
        status: "partial",
        generatedAt: new Date(now).toISOString()
      },
      snapshot: {
        available: false,
        timestamp: now,
        totalValue: null,
        dailyPL: null,
        dailyPLPct: null
      },
      signals: {
        available: false
      },
      limitations: ["Snapshot unavailable"],
      warnings: ["Snapshot input missing or malformed"]
    };
  }

  // --- Signals ---
  const signals = deriveInsightsSignals(snapshot);

  return {
    meta: {
      mode: "observer",
      phase: "1E",
      status: signals.available ? "ready" : "partial",
      generatedAt: new Date(now).toISOString()
    },

    snapshot: {
      available: true,
      timestamp: now,
      totalValue: snapshot.totals.snapshotValue,
      dailyPL: snapshot.totals.delta,
      dailyPLPct: snapshot.totals.deltaPct
    },

    signals: signals.available
      ? {
          available: true,
          risk: signals.risk,
          performance: signals.performance
        }
      : {
          available: false
        },

    limitations: signals.available ? [] : ["Signals withheld when snapshot inputs are incomplete"],
    warnings: []
  };
}

/**
 * 🔁 BACKWARD-COMPAT EXPORT
 * REQUIRED by Insights.jsx
 * DO NOT REMOVE
 */
export async function buildInsightsSnapshot(snapshot) {
  return buildInsightsSnapshotFromSnapshot(snapshot);
}

