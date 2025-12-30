// renderer/pages/Signals.jsx
// Signals — pure consumer UI (engine-only)

import React from "react";
import { getSignalsSnapshotEngine } from "../engine/signals/signalsEngine";

export default function Signals() {
  const snapshot = getSignalsSnapshotEngine();

  const rows = snapshot?.signals ?? [];
  const snapshotTime = snapshot?.timestamp ?? "—";

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "16px" }}>Signals</h1>

      <div
        style={{
          marginBottom: "20px",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "8px",
        }}
      >
        <strong>How to read this table:</strong>
        <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
          <li><b>Momentum</b>: Directional strength of recent price movement.</li>
          <li><b>Mean Reversion</b>: Distance from recent average price.</li>
          <li><b>Portfolio Impact</b>: Estimated influence on portfolio outcomes.</li>
          <li><b>Δ</b>: Change since last snapshot.</li>
        </ul>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <th>Symbol</th>
            <th>Asset Class</th>
            <th>Momentum</th>
            <th>Mean Reversion</th>
            <th>Portfolio Impact</th>
            <th>Δ</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: "16px", opacity: 0.6 }}>
                No signals available.
              </td>
            </tr>
          )}

          {rows.map((row) => (
            <tr key={row.symbol} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <td>{row.symbol}</td>
              <td>{row.assetClass}</td>
              <td>{row.momentum}</td>
              <td>{row.meanReversion}</td>
              <td>{row.portfolioImpact}</td>
              <td>{row.delta ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "12px", opacity: 0.6 }}>
        Snapshot time: {snapshotTime}
      </div>
    </div>
  );
}

