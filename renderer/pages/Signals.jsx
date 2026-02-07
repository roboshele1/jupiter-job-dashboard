import React, { useEffect, useState } from "react";

/**
 * SIGNALS — ALWAYS-ON TECHNICAL ANALYSIS
 * -------------------------------------
 * - Per-holding technical diagnostics (never silent)
 * - HOLD is a valid state and MUST render
 * - Non-HOLD states are visually emphasized
 */

const STATE_COLORS = {
  ACCUMULATE: "#22c55e",
  TRIM: "#f97316",
  DO_NOT_ADD: "#ef4444",
  HOLD: "#9ca3af",
  REVIEW_REQUIRED: "#eab308",
};

export default function Signals() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await window.jupiter.invoke(
          "portfolio:technicalSignals:getSnapshot"
        );
        if (alive) setSnapshot(data);
      } catch (e) {
        if (alive) setError(String(e));
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  if (error) {
    return <div style={{ padding: 24 }}>Error: {error}</div>;
  }

  if (!snapshot) {
    return <div style={{ padding: 24 }}>Loading technical analysis…</div>;
  }

  const signals = Object.values(snapshot.signals || {});

  return (
    <div style={{ padding: 32 }}>
      <h1>Portfolio Technical Analysis</h1>

      {snapshot.diagnostic && (
        <div style={{ opacity: 0.6, marginBottom: 16 }}>
          {snapshot.note}
        </div>
      )}

      {signals.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          No holdings available for analysis.
        </div>
      )}

      {signals.map(sig => (
        <div
          key={sig.symbol}
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 10,
            border: "1px solid #1f2937",
            background: "#020617"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{sig.symbol}</strong>
            <span style={{
              color: STATE_COLORS[sig.state] || "#9ca3af",
              fontWeight: 700
            }}>
              {sig.state}
            </span>
          </div>

          <pre style={{ opacity: 0.75, marginTop: 10 }}>
{JSON.stringify(sig.metrics, null, 2)}
          </pre>
        </div>
      ))}

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.4 }}>
        Snapshot time: {snapshot.asOf}
      </div>
    </div>
  );
}
