import React from "react";

/*
 Phase Q — Step 3
 Discovery → Automation Alerting

 Automation receives discovery matches and generates
 non-executing, portfolio-aware intelligence alerts.
*/

const discoveryAlerts = [
  {
    symbol: "AMD",
    similarity: 82,
    trigger: "High similarity to NVDA growth archetype",
    confidence: "HIGH",
    portfolioOverlap: "Medium",
  },
  {
    symbol: "SMCI",
    similarity: 76,
    trigger: "Infrastructure scaling pattern detected",
    confidence: "MEDIUM",
    portfolioOverlap: "Low",
  },
];

function confidenceColor(c) {
  if (c === "HIGH") return "#16a34a";
  if (c === "MEDIUM") return "#f59e0b";
  return "#64748b";
}

export default function Automation() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Automation Intelligence</h1>

      <div style={styles.card}>
        <div style={styles.header}>
          <span>Symbol</span>
          <span>Similarity</span>
          <span>Trigger</span>
          <span>Confidence</span>
          <span>Portfolio Overlap</span>
        </div>

        {discoveryAlerts.map((a) => (
          <div key={a.symbol} style={styles.row}>
            <strong>{a.symbol}</strong>
            <span>{a.similarity}%</span>
            <span>{a.trigger}</span>
            <span
              style={{
                ...styles.badge,
                background: confidenceColor(a.confidence),
              }}
            >
              {a.confidence}
            </span>
            <span>{a.portfolioOverlap}</span>
          </div>
        ))}
      </div>

      <div style={styles.notice}>
        Automation generates intelligence alerts only. No execution, no trades,
        no timing recommendations.
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background: "#020617",
    color: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    fontSize: "32px",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "16px",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr",
    fontSize: "12px",
    opacity: 0.7,
    marginBottom: "10px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontSize: "14px",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    color: "#ffffff",
    width: "fit-content",
  },
  notice: {
    marginTop: "16px",
    fontSize: "13px",
    opacity: 0.7,
    maxWidth: "720px",
  },
};

