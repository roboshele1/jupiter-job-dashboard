// renderer/pages/Risk.jsx
// Read-only Risk shell (no portfolio mutation)

import React from "react";

export default function Risk() {
  return (
    <div style={styles.container}>
      <h1>Risk Centre</h1>

      <div style={styles.card}>
        <h2>Portfolio Risk</h2>
        <p style={styles.muted}>
          Exposure, concentration, and drawdown analytics
          will render here.
        </p>
      </div>

      <div style={styles.card}>
        <h2>Status</h2>
        <p style={styles.muted}>
          • Snapshot source: Portfolio  
          • Engine: locked  
          • Writes: disabled
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    color: "#e5e7eb",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  muted: {
    opacity: 0.7,
  },
};

