import React from "react";
import { buildSnapshot } from "../services/snapshotAdapter";
import { interpretDashboard } from "../chat/interpretationEngine";

export default function Chat() {
  // Deterministic, read-only snapshot rows
  const snapshotRows = buildSnapshot();

  // Interpret snapshot rows (observer-only)
  const interpretation = interpretDashboard({
    topHoldings: snapshotRows,
  });

  return (
    <div style={{ padding: "24px" }}>
      <h1>Chat</h1>
      <p style={{ opacity: 0.8 }}>
        Read-only Dashboard context (Phase 3 · Observer).
      </p>

      <h2>Snapshot Rows</h2>
      <pre>{JSON.stringify(snapshotRows ?? [], null, 2)}</pre>

      <h2>Dashboard Interpretation</h2>
      <pre>{JSON.stringify(interpretation, null, 2)}</pre>

      {/* ---- Portfolio Reasoning (read-only exposure) ---- */}
      <h2>Portfolio Reasoning</h2>
      <div
        style={{
          marginTop: "12px",
          padding: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          maxWidth: "900px",
          opacity: 0.85,
        }}
      >
        {interpretation.reasoning ? (
          <>
            <p>
              <strong>Concentration:</strong>{" "}
              {interpretation.reasoning.concentration.summary ??
                "Unavailable"}
            </p>
            <p>
              <strong>Diversification:</strong>{" "}
              {interpretation.reasoning.diversification.summary ??
                "Unavailable"}
            </p>
            <p>
              <strong>Risk Exposure:</strong>{" "}
              {interpretation.reasoning.riskExposure.summary ??
                "Unavailable"}
            </p>
            <p style={{ opacity: 0.7, marginTop: "8px" }}>
              Observer mode · Explanatory only · No judgments
            </p>
          </>
        ) : (
          <p style={{ opacity: 0.7 }}>
            Reasoning unavailable — snapshot missing.
          </p>
        )}
      </div>
    </div>
  );
}

