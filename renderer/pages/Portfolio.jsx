import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "JUPITER_PORTFOLIO_UI_V3_STATE";

/* =========================
   Utilities
   ========================= */
function safeJsonParse(raw, fallback) {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function nowMs() {
  return Date.now();
}

function fmtMoney(n) {
  const num = Number(n || 0);
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* =========================
   UI State Persistence
   ========================= */
function readUiState() {
  return safeJsonParse(localStorage.getItem(STORAGE_KEY), {
    version: 3,
    updatedAt: 0
  });
}

function writeUiState(next) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 3,
      ...next,
      updatedAt: nowMs()
    })
  );
}

/* =========================
   Portfolio Component
   ========================= */
export default function Portfolio() {
  const [valuation, setValuation] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [uiState, setUiState] = useState(() => {
    try {
      return readUiState();
    } catch {
      return { version: 3, updatedAt: 0 };
    }
  });

  /* =========================
     Load LIVE valuation (authoritative)
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

  /* =========================
     Persist UI state
     ========================= */
  useEffect(() => {
    try {
      writeUiState(uiState);
    } catch {}
  }, [uiState]);

  /* =========================
     Visible Positions (read-only)
     ========================= */
  const visiblePositions = useMemo(() => {
    return valuation?.positions || [];
  }, [valuation]);

  /* =========================
     Render
     ========================= */
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!valuation) return <div>Loading portfolio…</div>;

  const totals = valuation.totals || {};

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Portfolio</h1>

      {/* Portfolio Actions — READ-ONLY SHELL */}
      <div className="card wide" style={{ marginBottom: 20, opacity: 0.6 }}>
        <strong>Portfolio Actions</strong>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Actions are disabled. Engine-backed actions will be enabled next.
        </div>
      </div>

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

      {/* Holdings — READ-ONLY */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visiblePositions.map(p => {
          const deltaColor = p.delta >= 0 ? "#2ecc71" : "#e74c3c";

          return (
            <div key={p.symbol} className="card wide" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.symbol}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {p.livePrice
                      ? `${p.currency} ${Number(p.livePrice).toLocaleString()}`
                      : "—"}
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
