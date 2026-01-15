import React, { useEffect, useMemo, useState } from "react";

/**
 * SIGNALS — V2 RENDERER CONSUMPTION
 * --------------------------------
 * ROLE:
 * - Pure consumer of Signals V2 intelligence
 * - Silence-by-default is a FEATURE, not an error
 * - No calculations, no ranking, no mutation
 *
 * AUTHORITIES:
 * - Portfolio valuation (single source of truth)
 * - Signals V2 snapshot (engine-owned)
 */

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

const confidenceStyle = (c) => ({
  fontWeight: 700,
  color:
    c === "High" ? "#22c55e" :
    c === "Medium" ? "#facc15" :
    "#9ca3af",
});

export default function Signals() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [selected, setSelected] = useState(null);

  /* =========================
     LOAD SIGNALS V2 SNAPSHOT
     ========================= */
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        if (!window.jupiter?.invoke) {
          setStatus("unavailable");
          return;
        }

        // Signals V2 is derived from portfolio valuation internally
        const valuation = await window.jupiter.invoke("portfolio:getValuation");

        if (!alive) return;

        if (!valuation?.signalsV2) {
          setSnapshot({
            surfaced: false,
            signals: [],
            notes: ["Signals engine silent by design."],
            timestamp: Date.now(),
          });
          setStatus("ready");
          return;
        }

        setSnapshot(valuation.signalsV2);
        setStatus("ready");
      } catch (err) {
        console.error("[SIGNALS_RENDER_ERROR]", err);
        setStatus("error");
      }
    }

    load();
    return () => (alive = false);
  }, []);

  /* =========================
     DERIVED VIEW
     ========================= */
  const signals = useMemo(() => {
    if (!snapshot?.signals) return [];
    return [...snapshot.signals].sort(
      (a, b) =>
        CONFIDENCE_ORDER[b.confidence] -
        CONFIDENCE_ORDER[a.confidence]
    );
  }, [snapshot]);

  /* =========================
     RENDER STATES
     ========================= */

  if (status === "loading") {
    return <div style={{ padding: 24 }}>Loading signals…</div>;
  }

  if (status === "unavailable" || status === "error") {
    return (
      <div style={{ padding: 24, color: "#9ca3af" }}>
        Signals unavailable — intelligence layer not initialized.
      </div>
    );
  }

  // ✅ SILENCE-BY-DEFAULT (THIS IS A SUCCESS STATE)
  if (!snapshot?.surfaced || signals.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Signals</h2>
        <p style={{ opacity: 0.7 }}>
          No material growth or risk disruptions detected.
        </p>
        <p style={{ opacity: 0.5, fontSize: 13 }}>
          Signals remain silent unless portfolio conditions change materially.
        </p>
      </div>
    );
  }

  /* =========================
     ACTIVE SIGNALS VIEW
     ========================= */

  return (
    <div style={{ padding: 24 }}>
      <h2>Signals</h2>

      <p style={{ opacity: 0.7, marginBottom: 12 }}>
        Signals surfaced due to material growth or risk disruption.
      </p>

      <table border="1" cellPadding="6" width="100%">
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="left">Asset Class</th>
            <th align="left">Confidence</th>
            <th align="left">Materiality</th>
            <th align="left">Growth Impact</th>
            <th align="left">Risk Context</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr
              key={s.symbol}
              onClick={() => setSelected(s)}
              style={{ cursor: "pointer" }}
            >
              <td>{s.symbol}</td>
              <td>{s.assetClass}</td>
              <td style={confidenceStyle(s.confidence)}>
                {s.confidence}
              </td>
              <td>{s.materiality}</td>
              <td>{s.growthImpact}</td>
              <td>{s.riskContext}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* =========================
         DETAIL PANEL
         ========================= */}
      {selected && (
        <div
          style={{
            marginTop: 16,
            padding: "16px",
            border: "1px solid #1f2937",
            borderRadius: 8,
            background: "#020617",
          }}
        >
          <h3>{selected.symbol} — Signal Context</h3>

          <ul style={{ marginTop: 8, opacity: 0.85 }}>
            <li><b>Confidence:</b> {selected.confidence}</li>
            <li><b>Materiality:</b> {selected.materiality}</li>
            <li><b>Growth Impact:</b> {selected.growthImpact}</li>
            <li><b>Risk Context:</b> {selected.riskContext}</li>
          </ul>

          <p style={{ marginTop: 10, fontSize: 13, opacity: 0.6 }}>
            Signals provide situational awareness only — not recommendations or actions.
          </p>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.5 }}>
        Snapshot time:{" "}
        {snapshot?.timestamp
          ? new Date(snapshot.timestamp).toLocaleString()
          : "—"}
      </div>
    </div>
  );
}
