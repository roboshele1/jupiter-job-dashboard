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

function normalizeSymbol(s) {
  return String(s || "").trim().toUpperCase();
}

function isValidQty(n) {
  return Number.isFinite(n) && n > 0;
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
    updatedAt: 0,
    qtyBySymbol: {},
    removedSymbols: [],
    addedSymbols: {}
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
      return {
        version: 3,
        updatedAt: 0,
        qtyBySymbol: {},
        removedSymbols: [],
        addedSymbols: {}
      };
    }
  });

  const [rowDraftQty, setRowDraftQty] = useState({});
  const [addSymbol, setAddSymbol] = useState("");
  const [addQty, setAddQty] = useState("");
  const [status, setStatus] = useState(null);

  /* =========================
     Load LIVE valuation (authoritative)
     ========================= */
  async function loadValuation() {
    try {
      const v = await window.jupiter.invoke("portfolio:getValuation");
      setValuation(v);

      const drafts = {};
      for (const p of v?.positions || []) {
        drafts[p.symbol] = String(p.qty ?? "");
      }
      for (const [s, q] of Object.entries(uiState.qtyBySymbol || {})) {
        drafts[s] = String(q);
      }
      for (const [s, v] of Object.entries(uiState.addedSymbols || {})) {
        drafts[s] = String(v.qty ?? "");
      }

      setRowDraftQty(drafts);
    } catch (err) {
      console.error("[PORTFOLIO_LOAD_ERROR]", err);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     Manual Refresh (V3)
     ========================= */
  async function refreshValuation() {
    try {
      setRefreshing(true);
      const v = await window.jupiter.refreshPortfolioValuation();
      setValuation(v);
      setStatus("Valuation refreshed");
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
     Visible Positions
     ========================= */
  const visiblePositions = useMemo(() => {
    const base = valuation?.positions || [];
    const removed = new Set(uiState.removedSymbols || []);
    const qtyBySymbol = uiState.qtyBySymbol || {};
    const added = uiState.addedSymbols || {};

    const merged = [];

    for (const p of base) {
      if (!p?.symbol || removed.has(p.symbol)) continue;
      const qty =
        Number.isFinite(qtyBySymbol[p.symbol]) ? qtyBySymbol[p.symbol] : p.qty;

      merged.push({ ...p, qty });
    }

    for (const [sym, payload] of Object.entries(added)) {
      if (removed.has(sym)) continue;
      if (merged.some(m => m.symbol === sym)) continue;

      merged.push({
        symbol: sym,
        qty: payload.qty,
        snapshotValue: 0,
        livePrice: 0,
        liveValue: 0,
        delta: 0,
        deltaPct: 0,
        currency: "",
        priceSource: "ui-only",
        priceFreshness: null
      });
    }

    return merged;
  }, [valuation, uiState]);

  /* =========================
     Actions
     ========================= */
  function setDraft(symbol, value) {
    setRowDraftQty(prev => ({ ...prev, [symbol]: value }));
  }

  function handleUpdate(symbol) {
    const qty = Number(rowDraftQty[symbol]);
    if (!isValidQty(qty)) {
      setStatus(`Invalid qty for ${symbol}`);
      return;
    }

    setUiState(prev => ({
      ...prev,
      qtyBySymbol: { ...(prev.qtyBySymbol || {}), [symbol]: qty }
    }));

    setStatus(`Updated ${symbol}`);
  }

  function handleRemove(symbol) {
    setUiState(prev => ({
      ...prev,
      removedSymbols: Array.from(
        new Set([...(prev.removedSymbols || []), symbol])
      )
    }));
    setStatus(`Removed ${symbol}`);
  }

  function handleAdd() {
    const sym = normalizeSymbol(addSymbol);
    const qty = Number(addQty);

    if (!sym || !isValidQty(qty)) {
      setStatus("Invalid symbol or qty");
      return;
    }

    setUiState(prev => ({
      ...prev,
      addedSymbols: { ...(prev.addedSymbols || {}), [sym]: { qty } }
    }));

    setRowDraftQty(prev => ({ ...prev, [sym]: String(qty) }));
    setAddSymbol("");
    setAddQty("");
    setStatus(`Added ${sym}`);
  }

  /* =========================
     Render
     ========================= */
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!valuation) return <div>Loading portfolio…</div>;

  const totals = valuation.totals || {};

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Portfolio</h1>

      {/* Refresh Control */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={refreshValuation} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh Valuation"}
        </button>
      </div>

      {/* Summary */}
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

      {/* Add */}
      <div className="card wide" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8, opacity: 0.7 }}>
          ADD POSITION (UI-ONLY)
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Symbol"
            value={addSymbol}
            onChange={e => setAddSymbol(e.target.value)}
          />
          <input
            placeholder="Qty"
            value={addQty}
            onChange={e => setAddQty(e.target.value)}
          />
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>

      {/* Holdings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visiblePositions.map(p => {
          const draft = rowDraftQty[p.symbol] ?? String(p.qty ?? "");
          const deltaColor = p.delta >= 0 ? "#2ecc71" : "#e74c3c";

          return (
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
                  <div style={{ color: deltaColor }}>
                    Δ {fmtMoney(p.delta)} ({Number(p.deltaPct).toFixed(2)}%)
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={draft}
                    onChange={e => setDraft(p.symbol, e.target.value)}
                    style={{ width: 90 }}
                  />
                  <button onClick={() => handleUpdate(p.symbol)}>
                    Update
                  </button>
                  <button onClick={() => handleRemove(p.symbol)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {status && <div style={{ marginTop: 12, opacity: 0.7 }}>{status}</div>}
    </div>
  );
}
