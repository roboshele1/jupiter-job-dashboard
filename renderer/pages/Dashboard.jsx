// renderer/pages/Dashboard.jsx
// JUPITER — Dashboard (READ-ONLY, INSTITUTIONAL)

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [aggregate, setAggregate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadAggregate() {
      try {
        const result = await window.electron.invoke("dashboard:getAggregate");
        if (mounted) setAggregate(result);
      } catch (err) {
        console.error("Dashboard aggregate failed:", err);
        if (mounted) setError("Failed to load dashboard data");
      }
    }

    loadAggregate();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div style={{ padding: 24 }}>Error: {error}</div>;
  }

  if (!aggregate) {
    return <div style={{ padding: 24 }}>Loading dashboard…</div>;
  }

  const {
    totalValue = 0,
    pnl = 0,
    pnlPct = 0,
    allocation = {},
    topHoldings = [],
  } = aggregate;

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard</h1>

      <section>
        <h2>Total Portfolio Value</h2>
        <div>${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Daily P/L</h2>
        <div style={{ color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
          ${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} (
          {(pnlPct * 100).toFixed(2)}%)
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Asset Allocation</h2>
        <ul>
          {Object.entries(allocation).map(([key, value]) => (
            <li key={key}>
              {key} — {(value * 100).toFixed(2)}%
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Top Holdings</h2>
        <ul>
          {topHoldings.map((h) => (
            <li key={h.symbol}>
              {h.symbol} — {h.quantity}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

