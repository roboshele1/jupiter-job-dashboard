// engine/decision/decisionOutputAdapter.js
// Decision Engine V2 — Output Adapter (read-only)

export function adaptDecisionOutput({ asOf, decisions }) {
  if (!Array.isArray(decisions)) {
    throw new Error("Invalid decisions payload");
  }

  const alerts = decisions.map(d => ({
    type: "DECISION",
    scope: d.scope,
    symbol: d.symbol ?? null,
    action: d.action,
    conviction: d.conviction,
    rank: d.rank,
    rationale: d.rationale,
    ttlHours: d.ttlHours,
    asOf
  }));

  return {
    engine: "DECISION_ENGINE_V2",
    asOf,
    count: alerts.length,
    alerts
  };
}

