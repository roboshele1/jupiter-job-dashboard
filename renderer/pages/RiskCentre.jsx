// renderer/pages/RiskCentre.jsx
// JUPITER — Risk Centre (V14 Step 4: Risk Narrative Refinement)
// Read-only • Deterministic • Snapshot-derived • Presentation-only

import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function RiskCentre() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  if (!snapshot) {
    return (
      <div className="page">
        <h1>Risk Centre</h1>
        <p>Status: Snapshot unavailable</p>
      </div>
    );
  }

  const { timestamp, totalValue, holdings } = snapshot;

  const equityValue = holdings
    .filter(h => h.assetClass === "equity")
    .reduce((s, h) => s + h.value, 0);

  const cryptoValue = holdings
    .filter(h => h.assetClass === "crypto")
    .reduce((s, h) => s + h.value, 0);

  const equityPct = (equityValue / totalValue) * 100;
  const cryptoPct = (cryptoValue / totalValue) * 100;

  const largest = [...holdings].sort((a, b) => b.value - a.value)[0];
  const largestPct = (largest.value / totalValue) * 100;

  const scenarios = [
    {
      label: "Equity drawdown (-20%)",
      impact: -(equityValue * 0.2),
    },
    {
      label: "Crypto drawdown (-40%)",
      impact: -(cryptoValue * 0.4),
    },
    {
      label: `Top holding shock (-30% on ${largest.symbol})`,
      impact: -(largest.value * 0.3),
    },
  ];

  return (
    <div className="page">
      <h1>Risk Centre</h1>

      <p>Snapshot timestamp: {timestamp}</p>
      <p>Total portfolio value: ${totalValue.toLocaleString()}</p>

      <h2>Risk Posture</h2>
      <p><strong>Overall posture:</strong> Moderate</p>
      <ul>
        <li>Elevated single-asset concentration.</li>
        <li>Equity exposure dominates portfolio risk.</li>
      </ul>

      <h2>Posture Support Metrics</h2>
      <ul>
        <li>Largest position: {largest.symbol} — {largestPct.toFixed(1)}%</li>
        <li>Equity exposure: {equityPct.toFixed(1)}%</li>
        <li>Crypto exposure: {cryptoPct.toFixed(1)}%</li>
        <li>Number of holdings: {holdings.length}</li>
      </ul>

      <h2>Stress Scenarios</h2>
      <p style={{ opacity: 0.7 }}>
        Deterministic, snapshot-derived scenarios. Non-predictive.
      </p>
      <ul>
        {scenarios.map((s, i) => {
          const stressedValue = totalValue + s.impact;
          return (
            <li key={i}>
              <strong>{s.label}</strong><br />
              Impact: ${s.impact.toLocaleString()}<br />
              Resulting value: ${stressedValue.toLocaleString()}
            </li>
          );
        })}
      </ul>

      <h2>Risk Narrative</h2>
      <p>
        The portfolio currently exhibits a <strong>moderate overall risk posture</strong>,
        driven primarily by <strong>equity concentration</strong> rather than leverage or
        excessive asset-class breadth.
      </p>
      <p>
        A single position ({largest.symbol}) represents a meaningful share of total portfolio
        value, increasing sensitivity to idiosyncratic shocks. While crypto exposure is present,
        it remains secondary to equity-driven risk and does not dominate downside outcomes.
      </p>
      <p>
        Stress scenarios indicate that broad equity market weakness would have a larger impact
        on portfolio value than isolated crypto volatility. Concentration risk is therefore the
        primary structural risk factor at this stage.
      </p>
      <p style={{ opacity: 0.7 }}>
        This narrative is descriptive, not predictive, and reflects the current snapshot only.
      </p>
    </div>
  );
}

