// renderer/pages/GrowthEngine.jsx
// Read-only Growth Engine surface
// NO authority, NO portfolio mutation, NO IPC writes

import React, { useEffect, useState } from "react";

export default function GrowthEngine() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        if (!window.jupiter?.getPortfolioSnapshot) {
          throw new Error("Portfolio snapshot unavailable");
        }

        const data = await window.jupiter.getPortfolioSnapshot();

        if (alive) {
          setSnapshot(data);
          setStatus("ready");
        }
      } catch (err) {
        if (alive) {
          setError(err.message);
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div style={styles.container}>
        <h1>Growth Engine</h1>
        <p style={styles.muted}>Evaluating growth vectors…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={styles.container}>
        <h1>Growth Engine</h1>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={styles.container}>
        <h1>Growth Engine</h1>
        <p style={styles.muted}>No portfolio data available.</p>
      </div>
    );
  }

  const positions = snapshot.positions || [];

  return (
    <div style={styles.container}>
      <h1>Growth Engine</h1>

      <div style={styles.card}>
        <h2>Current Capital Deployment</h2>

        {positions.length === 0 && (
          <p style={styles.muted}>No active positions.</p>
        )}

        {positions.map((p) => (
          <div key={p.symbol} style={styles.row}>
            <span>{p.symbol}</span>
            <span>
              {p.liveValue
                ? `$${p.liveValue.toLocaleString()}`
                : "—"}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h2>Growth Signals (Locked)</h2>
        <p style={styles.muted}>
          • Revenue acceleration detection  
          • Margin expansion trends  
          • Capital efficiency scoring  
          • Asymmetric upside filters  
          <br />
          <br />
          (Activated in Growth Intelligence phase)
        </p>
      </div>

      <div style={styles.footer}>
        Snapshot as of{" "}
        {snapshot._asOf
          ? new Date(snapshot._asOf).toLocaleString()
          : "unknown"}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: "900px",
    color: "#e5e7eb",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  muted: {
    opacity: 0.7,
  },
  footer: {
    marginTop: "24px",
    fontSize: "12px",
    opacity: 0.6,
  },
};

