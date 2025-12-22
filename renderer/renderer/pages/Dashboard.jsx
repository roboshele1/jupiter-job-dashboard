// renderer/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { readSnapshot, subscribeSnapshot } from "../state/snapshotStore";

export default function Dashboard() {
  const [snap, setSnap] = useState(readSnapshot());

  useEffect(() => {
    return subscribeSnapshot(setSnap);
  }, []);

  if (!snap) {
    return <div><h1>Dashboard</h1><p>Waiting for portfolio snapshot…</p></div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Snapshot time: {new Date(snap.timestamp).toLocaleString()}</p>
      <h2>Total Portfolio Value</h2>
      <h3>${snap.totalValue.toFixed(2)}</h3>

      <h2>Top Holdings</h2>
      <ul>
        {snap.rows.slice(0, 5).map(r => (
          <li key={r.symbol}>
            {r.symbol} — {r.qty}
          </li>
        ))}
      </ul>
    </div>
  );
}

