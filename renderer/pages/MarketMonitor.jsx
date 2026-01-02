import { useEffect, useState } from "react";

export default function MarketMonitor() {
  const [snapshot, setSnapshot] = useState(null);
  const [snapshotAt, setSnapshotAt] = useState(null);
  const [tickCount, setTickCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      setTickCount((c) => c + 1);

      try {
        if (!window.jupiter || !window.jupiter.getPortfolioValuation) {
          throw new Error("Portfolio valuation API unavailable");
        }

        // SINGLE SOURCE OF TRUTH — same as Portfolio tab
        const data = await window.jupiter.getPortfolioValuation();

        if (!alive) return;

        setSnapshot(data);
        setSnapshotAt(new Date());
        setError(null);
      } catch (err) {
        console.error("[MARKET_MONITOR_ERROR]", err);
        setError(err.message);
      }
    };

    poll();
    const id = setInterval(poll, 10_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <h1>Market Monitor</h1>

      <div>
        Snapshot as of: {snapshotAt ? snapshotAt.toLocaleString() : "—"}<br />
        Auto-refresh: every 10 seconds<br />
        Poll ticks: {tickCount}
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}
      {!snapshot && !error && <div>Loading portfolio snapshot…</div>}

      {snapshot && (
        <table border="1" cellPadding="6" style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Live Price</th>
              <th>Live $</th>
              <th>Δ</th>
              <th>Δ%</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.positions.map((p) => (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>{p.qty}</td>
                <td>{p.livePrice.toFixed(4)}</td>
                <td>${p.liveValue.toFixed(2)}</td>
                <td>${p.delta.toFixed(2)}</td>
                <td>{p.deltaPct.toFixed(2)}%</td>
                <td>{p.priceSource}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

