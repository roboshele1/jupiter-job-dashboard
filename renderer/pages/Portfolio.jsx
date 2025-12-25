// renderer/pages/Portfolio.jsx
// READ-ONLY Portfolio view
// Consumes Portfolio snapshot via preload → IPC
// No calculations, no mutations, no authority

import React, { useEffect, useState } from "react";

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (window.jupiter?.getPortfolioSnapshot) {
          const data = await window.jupiter.getPortfolioSnapshot();
          if (mounted) setSnapshot(data);
        }
      } catch (err) {
        console.error("Portfolio load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading portfolio…</div>;
  }

  if (!snapshot || !snapshot.positions?.length) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Portfolio</h1>
        <p style={styles.subtle}>No positions available.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Portfolio</h1>

      <div style={styles.card}>
        <div style={styles.headerRow}>
          <span>Symbol</span>
          <span>Qty</span>
          <span>Live Price</span>
          <span>Live Value</span>
        </div>

        {snapshot.positions.map((p) => (
          <div key={p.symbol} style={styles.row}>
            <strong>{p.symbol}</strong>
            <span>{p.qty}</span>
            <span>
              {p.livePrice?.toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
              }) ?? "—"}
            </span>
            <span>
              {p.liveValue?.toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
              }) ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    color: "#e5e7eb",
    width: "100%",
  },
  title: {
    fontSize: "28px",
    marginBottom: "24px",
  },
  subtle: {
    opacity: 0.6,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "20px",
    maxWidth: "800px",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    fontSize: "13px",
    opacity: 0.6,
    marginBottom: "12px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
};

