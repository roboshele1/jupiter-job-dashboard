import { useEffect, useState } from "react";

export default function Portfolio() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const result = await window.jupiter.getPortfolioValuation();
      setData(result);
    })();
  }, []);

  if (!data) return <div>Loading portfolio…</div>;

  return (
    <div>
      <h1>Portfolio</h1>

      <div style={{ marginBottom: 14 }}>
        <div><strong>Currency:</strong> {data.currency}</div>
        <div><strong>As-Of:</strong> {data._asOf ? new Date(data._asOf).toLocaleString() : "n/a"}</div>
        <div><strong>Total Snapshot:</strong> ${data.totals.snapshotValue.toFixed(2)}</div>
        <div><strong>Total Live:</strong> ${data.totals.liveValue.toFixed(2)}</div>
        <div><strong>Δ:</strong> ${data.totals.delta.toFixed(2)} ({data.totals.deltaPct.toFixed(2)}%)</div>

        <button
          onClick={async () => setData(await window.jupiter.refreshPortfolioValuation())}
          style={{ marginTop: 10 }}
        >
          Refresh Prices
        </button>
      </div>

      <table border="1" cellPadding="6">
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
          {data.positions.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.qty}</td>
              <td>${p.snapshotValue.toFixed(2)}</td>
              <td>{Number(p.livePrice).toFixed(4)}</td>
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

