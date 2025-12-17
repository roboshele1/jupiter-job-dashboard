import React from "react";
import { getLearningStats } from "../../engine/learningRegistry";

/*
 Phase T — Step 2
 Learning Stats Surface (Audit)

 Purpose:
 - Make learning visible & auditable
 - Show signal outcomes (win / miss / pending)
 - No interpretation, just facts
*/

export default function Audit() {
  const stats = getLearningStats();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Audit — Learning Registry</h1>

      <div style={styles.card}>
        <div style={styles.row}>
          <span>Total Signals</span>
          <strong>{stats.totalSignals}</strong>
        </div>
        <div style={styles.row}>
          <span>Wins</span>
          <strong>{stats.wins}</strong>
        </div>
        <div style={styles.row}>
          <span>Misses</span>
          <strong>{stats.misses}</strong>
        </div>
        <div style={styles.row}>
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div style={styles.row}>
          <span>Win Rate</span>
          <strong>{stats.winRate}</strong>
        </div>
      </div>

      <div style={styles.notice}>
        Learning metrics are recorded deterministically. No model fitting or
        prediction occurs at this stage.
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
    padding: "24px",
    borderRadius: "16px",
    maxWidth: "480px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "16px",
  },
  notice: {
    marginTop: "16px",
    fontSize: "13px",
    opacity: 0.7,
    maxWidth: "480px",
  },
};

