// renderer/pages/Dashboard.jsx

import { useEffect, useState } from "react";
import { getSnapshot, getPLHistory } from "../state/snapshotStore";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [dailyPL, setDailyPL] = useState(0);
  const [dailyPct, setDailyPct] = useState(0);

  useEffect(() => {
    const snap = getSnapshot();
    const history = getPLHistory();

    if (!snap) return;

    setSnapshot(snap);

    if (history.length >= 2) {
      const prev = history[history.length - 2].totalValue;
      const curr = history[history.length - 1].totalValue;
      const diff = curr - prev;

      setDailyPL(diff);
      setDailyPct(prev ? (diff / prev) * 100 : 0);
    }
  }, []);

  if (!snapshot) return <div>Waiting for portfolio snapshot...</div>;

  const equities = snapshot.rows.filter(r => r.source === "polygon");
  const crypto = snapshot.rows.filter(r => r.source === "coinbase");

  const eqValue = equities.reduce((s, r) => s + r.value, 0);
  const crValue = crypto.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Snapshot time: {snapshot.timestamp}</p>

      <h2>Total Portfolio Value</h2>
      <p>${snapshot.totalValue.toFixed(2)}</p>

      <h2>Daily P/L</h2>
      <p>
        ${dailyPL.toFixed(2)} ({dailyPct.toFixed(2)}%)
      </p>

      <h2>Asset Allocation</h2>
      <ul>
        <li>Equities — {((eqValue / snapshot.totalValue) * 100).toFixed(2)}%</li>
        <li>Digital Assets — {((crValue / snapshot.totalValue) * 100).toFixed(2)}%</li>
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

