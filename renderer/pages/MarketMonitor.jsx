// renderer/pages/MarketMonitor.jsx
// Market Monitor — V1
// Read-only consumer of Portfolio Snapshot Store
// Polls snapshot every 10s (no IPC, no routing, no engine)

import React, { useEffect, useState } from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function MarketMonitor() {
  const snapshot = usePortfolioSnapshotStore(s => s.snapshot);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
    }, 10000); // 10s polling
    return () => clearInterval(id);
  }, []);

  if (!snapshot || !snapshot.positions) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Market Monitor</h1>
        <p>Waiting for portfolio snapshot…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Market Monitor</h1>
      <p style={{ opacity: 0.7 }}>
        Read-only market state (auto-refresh every 10s)
      </p>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="left">Type</th>
            <th align="right">Live Value</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.positions.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.assetClass}</td>
              <td align="right">
                {typeof p.live === "number" ? p.live.toFixed(2) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
        Snapshot time: {snapshot.timestamp || "—"} | Tick: {tick}
      </div>
    </div>
  );
}

