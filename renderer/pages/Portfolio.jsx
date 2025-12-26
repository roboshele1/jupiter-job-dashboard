import { useEffect, useState } from "react";

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (!window.jupiter || !window.jupiter.getPortfolioValuation) {
          throw new Error("Portfolio API not available");
        }

        const data = await window.jupiter.getPortfolioValuation();
        setSnapshot(data);
      } catch (err) {
        console.error("[PORTFOLIO_RENDER_ERROR]", err);
        setError(err.message);
      }
    }

    load();
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!snapshot) return <div>Loading portfolio…</div>;

  return (
    <div>
      <h1>Portfolio</h1>

      <div>
        Currency: {snapshot.currency}<br />
        As-Of: {new Date(snapshot._asOf).toLocaleString()}<br />
        Total Snapshot: ${snapshot.totals.snapshotValue.toFixed(2)}<br />
        Total Live: ${snapshot.totals.liveValue.toFixed(2)}<br />
        Δ: ${snapshot.totals.delta.toFixed(2)} ({snapshot.totals.deltaPct.toFixed(2)}%)
      </div>

      <table border="1" cellPadding="6" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Snapshot $</th>
            <th>Live Price</th>
            <th>Live $</th>
            <th>Δ</th>
            <th>Δ%</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.positions.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.qty}</td>
              <td>${p.snapshotValue.toFixed(2)}</td>
              <td>{p.livePrice.toFixed(4)}</td>
              <td>${p.liveValue.toFixed(2)}</td>
              <td>${p.delta.toFixed(2)}</td>
              <td>{p.deltaPct.toFixed(2)}%</td>
              <td>{p.priceSource}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

