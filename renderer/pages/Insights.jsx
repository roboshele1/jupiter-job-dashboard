import React from "react";

export default function Insights() {
  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1>Insights</h1>
        <p style={{ maxWidth: "820px" }}>
          Read-only institutional insights.
          <br />
          Observer mode. No calculations. No IPC. No portfolio authority.
        </p>
      </header>

      <section style={{ marginBottom: "28px" }}>
        <h3>Snapshot Status</h3>
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            opacity: 0.8,
          }}
        >
          <p><strong>Available:</strong> No</p>
          <p><strong>Timestamp:</strong> Unavailable</p>
          <p style={{ opacity: 0.7 }}>
            Snapshot data is not currently present. Freshness cannot be assessed.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h3>Portfolio Overview</h3>
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            opacity: 0.8,
          }}
        >
          <p><strong>Total Value:</strong> Unavailable</p>
          <p><strong>Allocation Summary:</strong> Unavailable</p>
          <p style={{ opacity: 0.7 }}>
            Portfolio-level aggregates require an active dashboard snapshot.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h3>Signal Availability</h3>
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            opacity: 0.8,
          }}
        >
          <p><strong>Available Signals:</strong> None</p>
          <p><strong>Missing Signals:</strong></p>
          <ul>
            <li>portfolioValue</li>
            <li>dailyPL</li>
            <li>dailyPLPct</li>
            <li>allocation</li>
            <li>topHoldings</li>
          </ul>
          <p style={{ opacity: 0.7 }}>
            Signals are withheld when underlying snapshot inputs are incomplete.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h3>Risk Observations</h3>
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            opacity: 0.8,
          }}
        >
          <p>No structural risks detected.</p>
          <p style={{ opacity: 0.7 }}>
            This observation reflects absence of risk signals, not confirmation of safety.
          </p>
        </div>
      </section>

      <section>
        <h3>Data Limitations</h3>
        <div
          style={{
            marginTop: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            opacity: 0.75,
          }}
        >
          <ul>
            <li>Snapshot timestamp unavailable; freshness cannot be assessed.</li>
            <li>Portfolio aggregates unavailable due to missing snapshot inputs.</li>
          </ul>
          <p style={{ marginTop: "8px", opacity: 0.6 }}>
            System mode: observer · Phase 4
          </p>
        </div>
      </section>
    </div>
  );
}

