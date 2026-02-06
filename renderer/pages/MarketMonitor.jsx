import { useEffect, useMemo, useState } from "react";

export default function MarketMonitor() {
  const [valuation, setValuation] = useState(null);
  const [snapshotAt, setSnapshotAt] = useState(null);
  const [tickCount, setTickCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      setTickCount((c) => c + 1);

      try {
        if (!window.jupiter?.invoke) {
          throw new Error("IPC bridge not available");
        }

        const v = await window.jupiter.invoke("portfolio:getValuation");
        if (!alive) return;

        setValuation(v);
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

  const positions = useMemo(
    () => Array.isArray(valuation?.positions) ? valuation.positions : [],
    [valuation]
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>Market Monitor</h1>

      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        Snapshot as of: {snapshotAt ? snapshotAt.toLocaleString() : "—"}<br />
        Auto-refresh: every 10 seconds<br />
        Poll ticks: {tickCount}
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}
      {!valuation && !error && <div>Loading portfolio valuation…</div>}

      {positions.length > 0 && (
        <table border="1" cellPadding="6" style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Live Price</th>
              <th>Live $</th>
              <th>Book $</th>
              <th>Δ</th>
              <th>Δ%</th>
              <th>Source</th>
              <th>Freshness</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>{p.qty}</td>
                <td>{Number(p.livePrice ?? 0).toFixed(4)}</td>
                <td>${Number(p.liveValue ?? 0).toFixed(2)}</td>
                <td>${Number(p.snapshotValue ?? 0).toFixed(2)}</td>
                <td>${Number(p.delta ?? 0).toFixed(2)}</td>
                <td>{Number(p.deltaPct ?? 0).toFixed(2)}%</td>
                <td>{p.priceSource || "—"}</td>
                <td>
                  {p.priceFreshness
                    ? `${p.priceFreshness.level} (${p.priceFreshness.confidence})`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
