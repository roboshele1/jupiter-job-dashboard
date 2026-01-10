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
        Snapshot as of: {snapshotAt ? snapshotAt.toLocaleString() : "—"}<br />
        Auto-refresh: every 10 seconds<br />
        Poll ticks: {tickCount}
      </div>

      {/* ---- MARKET PULSE (D31.1 APPENDED) ---- */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #0f172a",
          borderRadius: "10px",
          padding: "1rem",
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Market Pulse</h3>
        <p style={{ opacity: 0.8, marginBottom: 12 }}>
          High-level snapshot of key markets for situational awareness.
          This is read-only context, not a trading signal.
        </p>

        <table width="100%" cellPadding="6">
          <thead>
            <tr>
              <th align="left">Market</th>
              <th align="left">Posture</th>
              <th align="left">Commentary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S&P 500</td>
              <td>NEUTRAL</td>
              <td>Broad equity benchmark, mixed momentum.</td>
            </tr>
            <tr>
              <td>Nasdaq</td>
              <td>STRONG</td>
              <td>Growth-heavy index showing relative strength.</td>
            </tr>
            <tr>
              <td>Bitcoin</td>
              <td>VOLATILE</td>
              <td>Crypto market reflecting elevated risk appetite.</td>
            </tr>
            <tr>
              <td>Ethereum</td>
              <td>VOLATILE</td>
              <td>Tracking broader crypto sentiment.</td>
            </tr>
            <tr>
              <td>US Dollar</td>
              <td>FIRM</td>
              <td>Dollar strength influencing risk assets.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {snapshot?.priceSnapshotMeta && (
        <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.8 }}>
          Price Source: <b>{snapshot.priceSnapshotMeta.source}</b><br />
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
