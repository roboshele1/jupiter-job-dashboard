import { useEffect } from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function Portfolio() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  useEffect(() => {
    if (!snapshot) {
      console.warn("PORTFOLIO: snapshot not yet loaded");
    }
  }, [snapshot]);

  if (!snapshot) {
    return <div>Loading portfolio…</div>;
  }

  const { totals, positions } = snapshot;

  return (
    <div>
      <h1>Portfolio</h1>

      <h2>
        Total Portfolio Value: $
        {totals?.liveValue?.toFixed(2) ?? "—"}
      </h2>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Snapshot $</th>
            <th>Live $</th>
            <th>Δ</th>
            <th>Δ%</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.qty}</td>
              <td>${p.snapshot.toFixed(2)}</td>
              <td>${p.live.toFixed(2)}</td>
              <td>${p.delta.toFixed(2)}</td>
              <td>{p.deltaPct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

