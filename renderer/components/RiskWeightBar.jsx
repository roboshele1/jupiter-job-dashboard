// renderer/components/RiskWeightBar.jsx

import React from "react";

export default function RiskWeightBar({ symbol, weight }) {
  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <span>{symbol}</span>
        <strong>{weight}%</strong>
      </div>

      <div style={styles.barBg}>
        <div
          style={{
            ...styles.barFill,
            width: `${weight}%`,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: "12px",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    marginBottom: "4px",
  },
  barBg: {
    width: "100%",
    height: "8px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "6px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
    borderRadius: "6px",
  },
};

