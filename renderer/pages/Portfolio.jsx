import { useEffect, useMemo, useState } from "react";
import PortfolioActionsDrawer from "../components/PortfolioActionsDrawer.jsx";

/* =========================
   Utilities (UNCHANGED)
   ========================= */
function fmtMoney(n) {
  const num = Number(n || 0);
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* =========================
   Portfolio Component
   ========================= */
export default function Portfolio() {
  const [valuation, setValuation] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  /* =========================
     Load LIVE valuation (AUTHORITATIVE)
     ========================= */
  async function loadValuation() {
    try {
      const v = await window.jupiter.invoke("portfolio:getValuation");
      setValuation(v);
    } catch (err) {
      console.error("[PORTFOLIO_LOAD_ERROR]", err);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadValuation();
  }, []);

  /* =========================
     Manual Refresh
     ========================= */
  async function refreshValuation() {
    try {
      setRefreshing(true);
      const v = await window.jupiter.refreshPortfolioValuation();
      setValuation(v);
    } catch (err) {
      console.error("[PORTFOLIO_REFRESH_ERROR]", err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  const positions = useMemo(() => {
    return valuation?.positions || [];
  }, [valuation]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!valuation) return <div>Loading portfolio…</div>;

  const totals = valuation.totals || {};

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Portfolio</h1>

      {/* =========================
          Portfolio Actions (LIVE)
          ========================= */}
      <div className="card wide" style={{ marginBottom: 20 }}>
        <strong>Portfolio Actions</strong>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Manage holdings via engine-backed actions.
        </div>
        <button
          style={{ marginTop: 10 }}
          onClick={() => setActionsOpen(true)}
        >
          Open Actions
        </button>
      </div>

      {/* Drawer */}
      <PortfolioActionsDrawer
        open={actionsOpen}
        onClose={() => {
          setActionsOpen(false);
          loadValuation(); // re-sync after mutations
        }}
      />

      {/* Refresh */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={refreshValuation} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh Valuation"}
        </button>
      </div>

      {/* Summary */}
      <div className="card wide" style={{ marginBottom: 20 }}>
        <div style={{ opacity: 0.7 }}>TOTAL BOOK COST</div>
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

      {/* Holdings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {positions.map(p => {
          const deltaColor = p.delta >= 0 ? "#2ecc71" : "#e74c3c";

          return (
            <div key={p.symbol} className="card wide" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.symbol}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {p.currency}{" "}
                    {Number(p.livePrice).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>
                    {p.priceSource}
                    {p.priceFreshness?.level
                      ? ` · ${p.priceFreshness.level}`
                      : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div>Book Cost {fmtMoney(p.snapshotValue)}</div>
                  <div>Live {fmtMoney(p.liveValue)}</div>
                  <div style={{ color: deltaColor }}>
                    Δ {fmtMoney(p.delta)} ({Number(p.deltaPct).toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
