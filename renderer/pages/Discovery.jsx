import React from "react";
import { scoreDiscoveryCandidate } from "../../engine/discoveryEngine";

/*
 Phase T — Step 4
 Surface Learning-Adjusted Discovery Scores

 Purpose:
 - Show base score vs adjusted score
 - Display rationale transparently
 - Make learning effects visible (no silent changes)
*/

const candidates = [
  { symbol: "AMD", baseScore: 78 },
  { symbol: "SMCI", baseScore: 74 },
  { symbol: "ARM", baseScore: 71 },
];

export default function Discovery() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Discovery — Learning-Adjusted Signals</h1>

      <div style={styles.grid}>
        {candidates.map((c) => {
          const scored = scoreDiscoveryCandidate(c.baseScore, c.symbol);

          return (
            <div key={c.symbol} style={styles.card}>
              <h2 style={styles.symbol}>{c.symbol}</h2>

              <div style={styles.row}>
                <span>Base Score</span>
                <strong>{c.baseScore}</strong>
              </div>

              <div style={styles.row}>
                <span>Adjusted Score</span>
                <strong>{scored.adjustedScore}</strong>
              </div>

              <div style={styles.rationale}>
                {scored.rationale}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.notice}>
        Scores are adjusted deterministically based on historical outcomes.
        No ML models or probabilistic fitting are used.
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
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    maxWidth: "900px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "16px",
  },
  symbol: {
    marginBottom: "12px",
    fontSize: "22px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "15px",
  },
  rationale: {
    marginTop: "10px",
    fontSize: "13px",
    opacity: 0.75,
  },
  notice: {
    marginTop: "20px",
    fontSize: "13px",
    opacity: 0.6,
    maxWidth: "600px",
  },
};

