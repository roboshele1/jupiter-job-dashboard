import { useEffect, useState } from "react";

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (!window.jupiter?.invoke) {
          throw new Error("IPC bridge not available");
        }

        const snap = await window.jupiter.invoke("portfolio:getSnapshot");
        setSnapshot(snap);
      } catch (err) {
        console.error("[PORTFOLIO_RENDER_ERROR]", err);
        setError(err.message);
      }
    }

    load();
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!snapshot) return <div>Loading portfolio…</div>;

  const portfolio = snapshot.portfolio;
  const positions = Array.isArray(portfolio?.positions)
    ? portfolio.positions
    : [];

  return (
    <div>
      <h1>Portfolio</h1>

      <div style={{ marginBottom: 12 }}>
        Currency: {portfolio.currency}<br />
        As-Of: {new Date(portfolio._asOf).toLocaleString()}<br />
        Total Snapshot: ${portfolio.totals.snapshotValue.toFixed(2)}<br />
        Total Live: ${portfolio.totals.liveValue.toFixed(2)}<br />
        Δ: ${portfolio.totals.delta.toFixed(2)} ({portfolio.totals.deltaPct.toFixed(2)}%)
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
            <th>Freshness</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.qty}</td>
              <td>${p.snapshotValue.toFixed(2)}</td>
              <td>{p.livePrice.toFixed(4)}</td>
              <td>${p.liveValue.toFixed(2)}</td>
              <td>${p.delta.toFixed(2)}</td>
              <td>{p.deltaPct.toFixed(2)}%</td>
              <td>{p.priceSource}</td>
              <td>
                {p.priceFreshness
                  ? `${p.priceFreshness.level} (${p.priceFreshness.confidence})`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
