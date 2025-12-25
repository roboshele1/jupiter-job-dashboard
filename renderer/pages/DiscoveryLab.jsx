// renderer/pages/DiscoveryLab.jsx
// Read-only exploration surface
// NO authority, NO IPC writes, NO engine access

import React, { useEffect, useState } from "react";

export default function DiscoveryLab() {
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
        <h1>Discovery Lab</h1>
        <p style={styles.muted}>Scanning portfolio universe…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={styles.container}>
        <h1>Discovery Lab</h1>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={styles.container}>
        <h1>Discovery Lab</h1>
        <p style={styles.muted}>No data available.</p>
      </div>
    );
  }

  const positions = snapshot.positions || [];

  return (
    <div style={styles.container}>
      <h1>Discovery Lab</h1>

      <div style={styles.card}>
        <h2>Current Holdings</h2>

        {positions.length === 0 && (
          <p style={styles.muted}>Portfolio is empty.</p>
        )}

        {positions.map((p) => (
          <div key={p.symbol} style={styles.row}>
            <span>{p.symbol}</span>
            <span>
              {p.qty} @{" "}
              {p.livePrice
                ? `$${p.livePrice.toLocaleString()}`
                : "—"}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h2>Discovery Signals (Locked)</h2>
        <p style={styles.muted}>
          • Factor discovery  
          • Theme clustering  
          • Asymmetric opportunity detection  
          <br />
          <br />
          (Activated in Growth / Discovery Engine phase)
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

