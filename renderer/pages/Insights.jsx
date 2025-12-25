// renderer/pages/Insights.jsx
// Read-only Insights shell (consumer only)

import React from "react";

export default function Insights() {
  return (
    <div style={styles.container}>
      <h1>Insights</h1>

      <div style={styles.card}>
        <h2>Interpretation Engine</h2>
        <p style={styles.muted}>
          Narrative insights, trend synthesis, and portfolio context
          will surface here.
        </p>
      </div>

      <div style={styles.card}>
        <h2>Status</h2>
        <p style={styles.muted}>
          • Input: Dashboard snapshot  
          • Output: narrative only  
          • Authority: none
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

