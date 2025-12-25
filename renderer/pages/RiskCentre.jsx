// renderer/pages/RiskCentre.jsx
import React, { useEffect, useState } from "react";

export default function RiskCentre() {
  const [risk, setRisk] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const r = await window.jupiter.getRiskSnapshot();
      const a = await window.jupiter.getRiskAlerts();

      if (mounted) {
        setRisk(r);
        setAlerts(a);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  if (!risk || !alerts) {
    return <div style={styles.loading}>Loading risk data…</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Risk Centre</h1>

      <div style={styles.card}>
        <h2 style={styles.section}>Portfolio Risk Summary</h2>

        <div style={styles.row}>
          <span>Top Holding</span>
          <strong>{risk.metrics?.topHolding ?? "—"}</strong>
        </div>

        <div style={styles.row}>
          <span>Top Weight</span>
          <strong>{risk.metrics?.topHoldingWeightPct ?? 0}%</strong>
        </div>

        <div style={styles.row}>
          <span>BTC Exposure</span>
          <strong>{risk.metrics?.btcExposurePct ?? 0}%</strong>
        </div>

        <div style={styles.row}>
          <span>Concentration Flag</span>
          <strong>
            {risk.metrics?.concentrationFlag ? "⚠️ YES" : "OK"}
          </strong>
        </div>

        <div style={styles.row}>
          <span>BTC Dominance Flag</span>
          <strong>
            {risk.metrics?.btcDominanceFlag ? "⚠️ YES" : "OK"}
          </strong>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.section}>Active Alerts</h2>

        {alerts.status === "NO_ALERTS" && (
          <div style={styles.ok}>No active alerts 🎯</div>
        )}

        {alerts.alerts?.length > 0 &&
          alerts.alerts.map((a, i) => (
            <div key={i} style={styles.alert}>
              <strong>{a.type}</strong>
              <div>{a.message}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 40, color: "#e5e7eb" },
  title: { fontSize: 28, marginBottom: 24 },
  section: { fontSize: 18, marginBottom: 12 },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    maxWidth: 520,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  alert: {
    background: "rgba(255,0,0,0.08)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ok: { opacity: 0.7 },
  loading: { padding: 40, opacity: 0.6 },
};

