import { useEffect, useState } from "react";

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.jupiter?.portfolio?.getSnapshot) {
      setError("Portfolio IPC unavailable");
      return;
    }

    window.jupiter.portfolio
      .getSnapshot()
      .then(setSnapshot)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  }

  if (!snapshot || snapshot.health?.isComplete !== true) {
    return <div style={{ padding: 32 }}>Loading portfolio…</div>;
  }

  const { totals, positions, performance } = snapshot;

  const fmt = v =>
    typeof v === "number" ? v.toLocaleString() : "—";

  return (
    <div style={{ padding: 32 }}>
      <h1>Portfolio</h1>

      <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
        <div style={{ background: "#0f172a", padding: 20, borderRadius: 12 }}>
          <div>Total Value</div>
          <div style={{ fontSize: 24 }}>
            ${fmt(totals.portfolioValue)}
          </div>
        </div>

        <div style={{ background: "#0f172a", padding: 20, borderRadius: 12 }}>
          <div>Unrealized P/L</div>
          <div style={{ fontSize: 24 }}>
            ${fmt(performance.unrealizedPL)} ({fmt(performance.unrealizedPLPct)}%)
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: 32 }}>Positions</h3>

      <table style={{ width: "100%", marginTop: 12 }}>
        <thead>
          <tr>
            <th align="left">Asset</th>
            <th align="right">Qty</th>
            <th align="right">Price</th>
            <th align="right">Value</th>
            <th align="right">Alloc %</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(p => (
            <tr key={p.assetId}>
              <td>{p.assetId}</td>
              <td align="right">{fmt(p.quantity)}</td>
              <td align="right">${fmt(p.price)}</td>
              <td align="right">${fmt(p.marketValue)}</td>
              <td align="right">{fmt(p.allocationPct)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

