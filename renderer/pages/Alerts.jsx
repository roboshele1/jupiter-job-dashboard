// renderer/pages/Alerts.jsx
import React, { useEffect, useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const a = await window.jupiter.getRiskAlerts();
      if (mounted) setAlerts(a);
    }

    load();
    return () => (mounted = false);
  }, []);

  if (!alerts) {
    return <div style={styles.loading}>Loading alerts…</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Alerts</h1>

      {alerts.status === "NO_ALERTS" && (
        <div style={styles.ok}>No active alerts 🎯</div>
      )}

      {alerts.alerts?.map((a, i) => (
        <div key={i} style={styles.alert}>
          <h3>{a.type}</h3>
          <p>{a.message}</p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { padding: 40, color: "#e5e7eb" },
  title: { fontSize: 28, marginBottom: 24 },
  alert: {
    background: "rgba(255,0,0,0.08)",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  ok: { opacity: 0.7 },
  loading: { padding: 40, opacity: 0.6 },
};

