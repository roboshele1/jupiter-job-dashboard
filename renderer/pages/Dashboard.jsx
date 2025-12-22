import { useEffect, useState } from "react";
import {
  subscribeSnapshot,
  readSnapshot,
  readPrevSnapshot,
} from "../state/snapshotStore";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(readSnapshot());
  const [prev, setPrev] = useState(readPrevSnapshot());

  useEffect(() => {
    return subscribeSnapshot((next, previous) => {
      setSnapshot(next);
      setPrev(previous);
    });
  }, []);

  if (!snapshot) {
    return <div>Waiting for portfolio snapshot...</div>;
  }

  const total = snapshot.totalValue || 0;
  const prevTotal = prev?.totalValue || 0;

  const dailyPL = total - prevTotal;
  const dailyPct =
    prevTotal > 0 ? (dailyPL / prevTotal) * 100 : 0;

  const equities = snapshot.rows
    .filter(r => r.source === "polygon")
    .reduce((s, r) => s + r.value, 0);

  const crypto = snapshot.rows
    .filter(r => r.source === "coinbase")
    .reduce((s, r) => s + r.value, 0);

  const eqPct = total > 0 ? (equities / total) * 100 : 0;
  const crPct = total > 0 ? (crypto / total) * 100 : 0;

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Snapshot time: {snapshot.timestamp}</div>

      <h2>Total Portfolio Value</h2>
      <div>${total.toFixed(2)}</div>

      <h2>Daily P/L</h2>
      <div>
        ${dailyPL.toFixed(2)} ({dailyPct.toFixed(2)}%)
      </div>

      <h2>Asset Allocation</h2>
      <ul>
        <li>Equities — {eqPct.toFixed(2)}%</li>
        <li>Digital Assets — {crPct.toFixed(2)}%</li>
      </ul>

      <h2>Top Holdings</h2>
      <ul>
        {snapshot.rows.slice(0, 5).map(r => (
          <li key={r.symbol}>
            {r.symbol} — {r.qty}
          </li>
        ))}
      </ul>
    </div>
  );
}

