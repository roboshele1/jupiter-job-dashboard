import { useEffect, useState } from "react";
import { readSnapshot, subscribeSnapshot } from "../state/snapshotStore";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(readSnapshot());

  useEffect(() => {
    return subscribeSnapshot(setSnapshot);
  }, []);

  if (!snapshot) {
    return <div>Waiting for portfolio snapshot…</div>;
  }

  const { totalValue, rows, timestamp } = snapshot;

  const equities = rows.filter(r => r.source === "polygon");
  const crypto = rows.filter(r => r.source === "coinbase");

  const equitiesValue = equities.reduce((s, r) => s + r.value, 0);
  const cryptoValue = crypto.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Snapshot time: {timestamp}</p>

      <h2>Total Portfolio Value</h2>
      <h3>${totalValue.toFixed(2)}</h3>

      <h2>Asset Allocation</h2>
      <ul>
        <li>Equities — {((equitiesValue / totalValue) * 100).toFixed(2)}%</li>
        <li>Digital Assets — {((cryptoValue / totalValue) * 100).toFixed(2)}%</li>
      </ul>

      <h2>Top Holdings</h2>
      <ul>
        {rows.slice(0, 5).map(r => (
          <li key={r.symbol}>
            {r.symbol} — {r.qty}
          </li>
        ))}
      </ul>
    </div>
  );
}

