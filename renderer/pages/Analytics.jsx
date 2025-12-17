import React, { useState } from "react";

/*
 Phase R — Step 4
 Confidence Bands & Scenario Ranges

 Purpose:
 - Show conservative / base / optimistic outcomes
 - Range-based thinking (institutional standard)
 - No forecasts, no ML
*/

const currentPortfolio = {
  totalValue: 53140,
  concentrationPenalty: 0.9,
};

function futureValue(monthly, years, annualReturn) {
  const months = years * 12;
  const r = annualReturn / 100 / 12;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

export default function Analytics() {
  const [target, setTarget] = useState(1000000);
  const [years, setYears] = useState(20);
  const [monthly, setMonthly] = useState(1000);

  const conservative = futureValue(monthly, years, 6) * 0.85;
  const base = futureValue(monthly, years, 8) * currentPortfolio.concentrationPenalty;
  const optimistic = futureValue(monthly, years, 10);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Planning — Confidence Bands</h1>

      <div style={styles.card}>
        <div style={styles.inputRow}>
          <label>Target Amount ($)</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </div>

        <div style={styles.inputRow}>
          <label>Time Horizon (Years)</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          />
        </div>

        <div style={styles.inputRow}>
          <label>Monthly Contribution ($)</label>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
          />
        </div>

        <div style={styles.band}>
          <span>Conservative (6%)</span>
          <strong>${(conservative + currentPortfolio.totalValue).toFixed(0).toLocaleString()}</strong>
        </div>

        <div style={styles.band}>
          <span>Base Case (8%)</span>
          <strong>${(base + currentPortfolio.totalValue).toFixed(0).toLocaleString()}</strong>
        </div>

        <div style={styles.band}>
          <span>Optimistic (10%)</span>
          <strong>${(optimistic + currentPortfolio.totalValue).toFixed(0).toLocaleString()}</strong>
        </div>
      </div>

      <div style={styles.notice}>
        Confidence bands show outcome ranges, not predictions. Planning is
        conservative and portfolio-aware.
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
    maxWidth: "560px",
  },
  inputRow: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "14px",
    fontSize: "14px",
  },
  band: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
    fontSize: "16px",
  },
  notice: {
    marginTop: "16px",
    fontSize: "13px",
    opacity: 0.7,
    maxWidth: "560px",
  },
};

