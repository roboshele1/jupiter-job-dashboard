import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "JUPITER_PORTFOLIO_UI_V3_STATE";

function safeJsonParse(raw, fallback) {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
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
        if (!window.jupiter?.invoke) {
          throw new Error("IPC bridge not available");
        }

        const snap = await window.jupiter.invoke("portfolio:getSnapshot");
        if (!alive) return;

        setSnapshot(snap);
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

  /* =========================
     RENDERER TRUTH ALIGNMENT
     Same normalization as Portfolio
     ========================= */
  const visiblePositions = useMemo(() => {
    if (!snapshot?.portfolio?.positions) return [];

    const uiState = safeJsonParse(
      localStorage.getItem(STORAGE_KEY),
      {
        qtyBySymbol: {},
        removedSymbols: [],
        addedSymbols: {}
      }
    );

    const removed = new Set(uiState.removedSymbols || []);
    const qtyBySymbol = uiState.qtyBySymbol || {};
    const added = uiState.addedSymbols || {};

    const merged = [];

    // Base snapshot positions
    for (const p of snapshot.portfolio.positions) {
      const sym = p.symbol;
      if (!sym || removed.has(sym)) continue;

      const overrideQty = qtyBySymbol[sym];
      const qty =
        typeof overrideQty === "number" && Number.isFinite(overrideQty)
          ? overrideQty
          : p.qty;

      merged.push({ ...p, qty });
    }

    // Renderer-only added symbols
    for (const [sym, payload] of Object.entries(added)) {
      if (!sym || removed.has(sym)) continue;
      if (merged.some((m) => m.symbol === sym)) continue;

      merged.push({
        symbol: sym,
        qty: Number(payload?.qty) || 0,
        snapshotValue: 0,
        livePrice: 0,
        liveValue: 0,
        delta: 0,
        deltaPct: 0,
        priceSource: "ui-only",
        priceFreshness: null
      });
    }

    return merged;
  }, [snapshot]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Market Monitor</h1>

      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        Snapshot as of: {snapshotAt ? snapshotAt.toLocaleString() : "—"}<br />
        Auto-refresh: every 10 seconds<br />
        Poll ticks: {tickCount}
      </div>

      {/* ---- MARKET PULSE ---- */}
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

      {error && <div style={{ color: "red" }}>{error}</div>}
      {!snapshot && !error && <div>Loading portfolio snapshot…</div>}

      {visiblePositions.length > 0 && (
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
            {visiblePositions.map((p) => (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>{p.qty}</td>
                <td>{Number(p.livePrice ?? 0).toFixed(4)}</td>
                <td>${Number(p.liveValue ?? 0).toFixed(2)}</td>
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
