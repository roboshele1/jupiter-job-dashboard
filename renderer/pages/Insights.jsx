import React from "react";
import { buildInsights } from "../insights/insightsPipeline";

export default function Insights() {
  const insights = buildInsights();

  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1>Insights</h1>
        <p style={{ maxWidth: "820px", opacity: 0.85 }}>
          Read-only institutional insights.
          <br />
          Observer mode. No advice. No actions. No portfolio authority.
        </p>
      </header>

      {/* Snapshot Status */}
      <section style={{ marginBottom: "28px" }}>
        <h3>Snapshot Status</h3>
        <Card>
          <p>
            <strong>Available:</strong>{" "}
            {insights.meta.status === "ok" ? "Yes" : "No"}
          </p>
          <p>
            <strong>Timestamp:</strong>{" "}
            {insights.meta.snapshotTimestamp || "Unavailable"}
          </p>
          {insights.warnings.length > 0 && (
            <Muted>
              {insights.warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </Muted>
          )}
        </Card>
      </section>

      {/* Portfolio Overview */}
      <section style={{ marginBottom: "28px" }}>
        <h3>Portfolio Overview</h3>
        <Card>
          <p>
            <strong>Total Value:</strong>{" "}
            {insights.portfolio.totalValue ?? "Unavailable"}
          </p>
          <p>
            <strong>Allocation Summary:</strong>{" "}
            {insights.portfolio.allocation ?? "Unavailable"}
          </p>
          <Muted>
            Portfolio-level aggregates require an active dashboard snapshot.
          </Muted>
        </Card>
      </section>

      {/* Signal Availability */}
      <section style={{ marginBottom: "28px" }}>
        <h3>Signal Availability</h3>
        <Card>
          <p>
            <strong>Available Signals:</strong>{" "}
            {insights.signals.available.length || "None"}
          </p>
          <p>
            <strong>Missing Signals:</strong>
          </p>
          <ul>
            {insights.signals.missing.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <Muted>
            Signals are withheld when snapshot inputs are incomplete.
          </Muted>
        </Card>
      </section>

      {/* Risk Observations */}
      <section style={{ marginBottom: "28px" }}>
        <h3>Risk Observations</h3>
        <Card>
          {insights.risks.observations.length === 0 ? (
            <p>No structural risks detected.</p>
          ) : (
            insights.risks.observations.map((r, i) => (
              <p key={i}>{r}</p>
            ))
          )}
          <Muted>
            Absence of risk signals is not confirmation of safety.
          </Muted>
        </Card>
      </section>

      {/* Data Limitations */}
      <section>
        <h3>Data Limitations</h3>
        <Card>
          <ul>
            {insights.limits.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <Muted>
            System mode: observer · Phase {insights.meta.phase}
          </Muted>
        </Card>
      </section>
    </div>
  );
}

/* ---------- UI Primitives ---------- */

function Card({ children }) {
  return (
    <div
      style={{
        marginTop: "12px",
        padding: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        opacity: 0.85,
      }}
    >
      {children}
    </div>
  );
}

function Muted({ children }) {
  return <p style={{ marginTop: "8px", opacity: 0.65 }}>{children}</p>;
}

