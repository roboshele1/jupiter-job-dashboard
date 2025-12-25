import React, { useEffect, useState } from "react";
import holdings from "../data/dashboardHoldings.json";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (window?.jupiter?.getDashboardSnapshot) {
          const snap = await window.jupiter.getDashboardSnapshot();
          if (mounted) setSnapshot(snap);
        }
      } catch (e) {
        console.error("Dashboard snapshot load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>

      {loading && (
        <div style={styles.placeholder}>
          <p>Loading portfolio snapshot…</p>
        </div>
      )}

      {!loading && !snapshot && (
        <div style={styles.placeholder}>
          <p>Portfolio snapshot not available.</p>
          <p style={styles.subtle}>
            Waiting for Portfolio to publish a snapshot.
          </p>
        </div>
      )}

      {!loading && snapshot && (
        <>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Portfolio Summary</h2>

            <div style={styles.row}>
              <span>Live Value</span>
              <strong>
                {Number.isFinite(snapshot.totals?.liveValue)
                  ? `$${snapshot.totals.liveValue.toLocaleString()}`
                  : "—"}
              </strong>
            </div>

            <div style={styles.row}>
              <span>Snapshot Value</span>
              <strong>
                {Number.isFinite(snapshot.totals?.snapshotValue)
                  ? `$${snapshot.totals.snapshotValue.toLocaleString()}`
                  : "—"}
              </strong>
            </div>

            <div style={styles.row}>
              <span>Δ</span>
              <strong>
                {Number.isFinite(snapshot.totals?.delta)
                  ? `$${snapshot.totals.delta.toLocaleString()}`
                  : "—"}
              </strong>
            </div>

            <div style={styles.footer}>
              Snapshot as of{" "}
              {snapshot._asOf
                ? new Date(snapshot._asOf).toLocaleString()
                : "unknown"}
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: "24px" }}>
            <h2 style={styles.cardTitle}>Top Holdings</h2>

            {holdings.map((h) => (
              <div key={h.symbol} style={styles.row}>
                <span>{h.symbol}</span>
                <strong>{h.weight}%</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    color: "#e5e7eb",
  },
  title: {
    fontSize: "28px",
    marginBottom: "24px",
  },
  placeholder: {
    opacity: 0.6,
  },
  subtle: {
    fontSize: "13px",
    marginTop: "6px",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "22px",
    maxWidth: "460px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  cardTitle: {
    fontSize: "18px",
    marginBottom: "18px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  footer: {
    marginTop: "18px",
    fontSize: "12px",
    opacity: 0.6,
  },
};

