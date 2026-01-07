import { useEffect, useState } from "react";

function FreshnessBadge({ freshness }) {
  if (!freshness) return <span style={{ opacity: 0.5 }}>—</span>;

  const { level, confidence, ageSeconds } = freshness;

  let color = "#999";
  if (level === "LIVE") color = "#2ecc71";
  if (level === "DELAYED") color = "#f1c40f";
  if (level === "STALE") color = "#e74c3c";

  return (
    <span
      title={`Age: ${ageSeconds}s | Confidence: ${confidence}`}
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: color,
        color: "#000",
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

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
    <div style={{ padding: 24 }}>
      <h1>Market Monitor</h1>

      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        Snapshot as of: {snapshotAt ? snapshotAt.toLocaleString() : "—"}
        <br />
        Auto-refresh: every 10 seconds
        <br />
        Poll ticks: {tickCount}
      </div>

      {snapshot?.priceSnapshotMeta && (
        <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.8 }}>
          Price Source: <b>{snapshot.priceSnapshotMeta.source}</b>
          <br />
          Price Fetched At:{" "}
          {new Date(snapshot.priceSnapshotMeta.fetchedAt).toLocaleString()}
        </div>
      )}

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
              <th>Freshness</th>
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
                <td>
                  <FreshnessBadge freshness={p.freshness} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

