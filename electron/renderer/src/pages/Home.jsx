import React, { useEffect, useState } from "react";

export default function Home() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (window.api?.getPortfolioSnapshot) {
      window.api.getPortfolioSnapshot().then(setSnapshot);
    }
  }, []);

  if (!snapshot) {
    return <div>Loading dashboard…</div>;
  }

  return (
    <div>
      <h2>Portfolio Overview</h2>

      <div style={{ marginTop: 12 }}>
        <strong>Total Value:</strong>{" "}
        {snapshot.totalValue?.toLocaleString()}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Top Holdings</h3>
        <ul>
          {snapshot.positions.map((p) => (
            <li key={p.symbol}>
              {p.symbol} — {p.qty} @ {p.price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

