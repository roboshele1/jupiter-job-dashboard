import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function RiskCentre() {
  const snapshot = usePortfolioSnapshotStore(s => s.snapshot);

  if (!snapshot || !snapshot.holdings || snapshot.holdings.length === 0) {
    return (
      <div className="page">
        <h1>Risk Centre</h1>
        <p>Status: Snapshot unavailable (fail-closed)</p>
      </div>
    );
  }

  const totalValue = snapshot.totalValue;
  const holdings = snapshot.holdings;

  // ---- Exposure by Asset Class ----
  const byAssetClass = holdings.reduce((acc, h) => {
    acc[h.assetClass] = (acc[h.assetClass] || 0) + h.value;
    return acc;
  }, {});

  const exposure = {
    equity: ((byAssetClass.equity || 0) / totalValue) * 100,
    crypto: ((byAssetClass.crypto || 0) / totalValue) * 100
  };

  // ---- Concentration ----
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const topPct = (top.value / totalValue) * 100;

  // ---- Stress Scenarios ----
  const stress = [
    { label: "Equity -10%", impact: exposure.equity * -0.10 },
    { label: "Equity -20%", impact: exposure.equity * -0.20 },
    { label: "Crypto -20%", impact: exposure.crypto * -0.20 },
    { label: "Crypto -40%", impact: exposure.crypto * -0.40 },
    { label: "Equity -20% + Crypto -30%", impact: (exposure.equity * -0.20) + (exposure.crypto * -0.30) }
  ];

  // ---- Threshold Rules (Deterministic) ----
  const breaches = [];

  if (topPct > 25) {
    breaches.push(`High concentration: ${top.symbol} at ${topPct.toFixed(1)}%`);
  }

  if (exposure.crypto > 30) {
    breaches.push(`Elevated crypto exposure: ${exposure.crypto.toFixed(1)}%`);
  }

  const worstStress = Math.min(...stress.map(s => s.impact));
  if (worstStress < -20) {
    breaches.push("Severe portfolio stress under combined shock");
  }

  return (
    <div className="page">
      <h1>Risk Centre</h1>

      <p>
        Mode: Read-only · Deterministic · Intelligence-only<br />
        Snapshot as of: {new Date(snapshot.timestamp).toLocaleString()}
      </p>

      <hr />

      <h2>Exposure</h2>
      <p>Equity: {exposure.equity.toFixed(1)}%</p>
      <p>Crypto: {exposure.crypto.toFixed(1)}%</p>

      <h2>Concentration</h2>
      <p>Top position: {top.symbol} — {topPct.toFixed(1)}%</p>

      <h2>Risk Decomposition — By Asset</h2>
      <ul>
        {sorted.map(h => (
          <li key={h.symbol}>
            {h.symbol} — {((h.value / totalValue) * 100).toFixed(1)}%
          </li>
        ))}
      </ul>

      <h2>Stress Scenarios</h2>
      <ul>
        {stress.map(s => (
          <li key={s.label}>
            {s.label}: {s.impact.toFixed(1)}% ({Math.round((s.impact / 100) * totalValue)})
          </li>
        ))}
      </ul>

      <h2>Risk Threshold Breaches</h2>
      {breaches.length === 0 ? (
        <p>No threshold breaches detected</p>
      ) : (
        <ul>
          {breaches.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}

