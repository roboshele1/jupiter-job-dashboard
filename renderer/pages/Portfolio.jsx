import React, { useEffect, useState } from "react";

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await window.portfolio.getSnapshot();
        if (!res.ok) throw new Error(res.error);
        setSnapshot(res.data);
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!snapshot) return <div>Loading portfolio…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Portfolio</h2>

      <h3>Total Value</h3>
      <p>${snapshot.totals.value.toFixed(2)}</p>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Value</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.positions.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.quantity}</td>
              <td>{p.price?.toFixed(2)}</td>
              <td>{p.marketValue?.toFixed(2)}</td>
              <td>{p.pnl?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

