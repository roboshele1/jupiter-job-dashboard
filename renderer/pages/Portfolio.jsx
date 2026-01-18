import { useEffect, useState } from "react";

export default function Portfolio() {
  const [valuation, setValuation] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  /* =========================
     Load canonical valuation
     ========================= */
  async function loadValuation() {
    try {
      const v = await window.jupiter.getPortfolioValuation();
      setValuation(v);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("[PORTFOLIO_LOAD_ERROR]", err);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadValuation();
  }, []);

  /* =========================
     Canonical Refresh (V9)
     ========================= */
  async function refreshSnapshot() {
    try {
      setRefreshing(true);
      const v = await window.jupiter.refreshPortfolioValuation();
      setValuation(v);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("[PORTFOLIO_REFRESH_ERROR]", err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  /* =========================
     Render guards
     ========================= */
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!valuation) return <div>Loading portfolio…</div>;

  const totals = valuation.totals || {};
  const positions = valuation.positions || [];

  function fmtMoney(n) {
    const num = Number(n || 0);
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /* =========================
     Render
     ========================= */
  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Portfolio</h1>

      {/* Refresh control */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={refreshSnapshot} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh Snapshot"}
        </button>
        {lastRefreshedAt && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
            Last refreshed: {lastRefreshedAt.toLocaleString()}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="card wide" style={{ marginBottom: 20 }}>
        <div style={{ opacity: 0.7 }}>TOTAL SNAPSHOT</div>
        <div style={{ fontSize: 24 }}>{fmtMoney(totals.snapshotValue)}</div>

        <div style={{ opacity: 0.7, marginTop: 8 }}>TOTAL LIVE</div>
        <div style={{ fontSize: 24 }}>{fmtMoney(totals.liveValue)}</div>

        <div
          style={{
            marginTop: 6,
            color: totals.delta >= 0 ? "#2ecc71" : "#e74c3c"
          }}
        >
          Δ {fmtMoney(totals.delta)} ({Number(totals.deltaPct).toFixed(2)}%)
        </div>
      </div>

      {/* Positions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {positions.map(p => (
          <div key={p.symbol} className="card wide" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {/* Identity */}
              <div>
                <div style={{ fontWeight: 600 }}>{p.symbol}</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {p.livePrice
                    ? `${p.currency} ${Number(p.livePrice).toLocaleString()}`
                    : "—"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>
                  {p.priceSource}
                  {p.priceFreshness?.level
                    ? ` · ${p.priceFreshness.level}`
                    : ""}
                </div>
              </div>

              {/* Values */}
              <div style={{ textAlign: "right" }}>
                <div>Snapshot {fmtMoney(p.snapshotValue)}</div>
                <div>Live {fmtMoney(p.liveValue)}</div>
                <div
                  style={{
                    color: p.delta >= 0 ? "#2ecc71" : "#e74c3c"
                  }}
                >
                  Δ {fmtMoney(p.delta)} ({Number(p.deltaPct).toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
