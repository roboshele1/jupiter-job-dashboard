import React from "react";

export default function Risk() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Risk</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Concentration</h3>
          <p>Top Position: —</p>
          <p>Top 3 Exposure: —</p>
          <p>Herfindahl Index: —</p>
        </div>

        <div style={styles.card}>
          <h3>Exposure</h3>
          <p>Single-name max: —</p>
          <p>Sector max: —</p>
          <p>Cash buffer: —</p>
        </div>

        <div style={styles.card}>
          <h3>Volatility</h3>
          <p>Portfolio vol (proxy): —</p>
          <p>Drawdown (30D): —</p>
          <p>Stress flag: —</p>
        </div>
      </div>

      <div style={styles.note}>
        Metrics pending engine wiring.
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    background: "#020617",
    color: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    fontSize: "42px",
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "24px",
  },
  note: {
    marginTop: "24px",
    opacity: 0.7,
  },
};

