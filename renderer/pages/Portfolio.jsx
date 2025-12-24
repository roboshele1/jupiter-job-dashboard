// renderer/pages/Portfolio.jsx
// JUPITER — Portfolio (V1 Read-Only, Deterministic, Null-Safe)

import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function Portfolio() {
  const snapshot = usePortfolioSnapshotStore(s => s.snapshot);

  if (!snapshot || !snapshot.positions || !snapshot.totals) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Portfolio</h1>
        <p>Loading portfolio snapshot...</p>
      </div>
    );
  }

  const {
    totals: { snapshotValue = 0, liveValue = 0, delta = 0, deltaPct = 0 },
    positions = []
  } = snapshot;

  return (
    <div style={{ padding: 24 }}>
      <h1>Portfolio</h1>

      <div style={{ marginBottom: 24 }}>
        <div>Total Snapshot: ${snapshotValue.toFixed(2)}</div>
        <div>Total Live: ${liveValue.toFixed(2)}</div>
        <div>
          Δ ${delta.toFixed(2)} ({deltaPct.toFixed(2)}%)
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="right">Qty</th>
            <th align="right">Snapshot $</th>
            <th align="right">Live $</th>
            <th align="right">Δ</th>
            <th align="right">Δ%</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => {
            const snap = Number(p.snapshot || 0);
            const live = Number(p.live || 0);
            const d = live - snap;
            const dp = snap !== 0 ? (d / snap) * 100 : 0;

            return (
              <tr key={i}>
                <td>{p.symbol}</td>
                <td align="right">{p.qty}</td>
                <td align="right">${snap.toFixed(2)}</td>
                <td align="right">${live.toFixed(2)}</td>
                <td align="right">${d.toFixed(2)}</td>
                <td align="right">{dp.toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

