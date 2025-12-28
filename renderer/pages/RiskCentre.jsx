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

  const byAssetClass = snapshot.holdings.reduce((acc, h) => {
    acc[h.assetClass] = (acc[h.assetClass] || 0) + h.value;
    return acc;
  }, {});

  const exposure = {
    equity: ((byAssetClass.equity || 0) / totalValue) * 100,
    crypto: ((byAssetClass.crypto || 0) / totalValue) * 100,
  };

  const sorted = [...snapshot.holdings].sort((a, b) => b.value - a.value);
  const top = sorted[0];

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
      <p>
        Top position: {top.symbol} — {((top.value / totalValue) * 100).toFixed(1)}%
      </p>

      <h2>Top Risk Contributors</h2>
      <ul>
        {sorted.slice(0, 5).map(h => (
          <li key={h.symbol}>
            {h.symbol} — {((h.value / totalValue) * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

