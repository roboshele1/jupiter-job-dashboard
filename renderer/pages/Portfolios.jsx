// renderer/pages/Portfolios.jsx
// JUPITER — Portfolio Holdings Manager
// Reads/writes engine/data/users/default/holdings.json via IPC

import React, { useEffect, useState, useCallback } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#060910",
  panel:     "#0d1117",
  border:    "#1e2530",
  accent:    "#3b82f6",
  accentDim: "#1d4ed8",
  green:     "#22c55e",
  red:       "#ef4444",
  yellow:    "#f59e0b",
  muted:     "#6b7280",
  text:      "#e2e8f0",
  subtext:   "#94a3b8",
  mono:      "'IBM Plex Mono', monospace",
};

const ASSET_CLASSES = ["equity", "crypto", "etf"];
const CURRENCIES    = ["CAD", "USD"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function assetBadge(cls) {
  const map = {
    equity: { label: "EQ",     color: C.accent  },
    crypto: { label: "CRYPTO", color: C.yellow  },
    etf:    { label: "ETF",    color: C.green   },
  };
  const b = map[cls] || { label: cls?.toUpperCase() || "?", color: C.muted };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
      background: b.color + "22", color: b.color,
      border: `1px solid ${b.color}44`,
      borderRadius: 4, padding: "2px 6px",
      fontFamily: C.mono,
    }}>{b.label}</span>
  );
}

function fmtCurrency(n, currency = "CAD") {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency", currency, maximumFractionDigits: 2
  }).format(n);
}

function fmtQty(n) {
  if (n == null || isNaN(n)) return "—";
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(6).replace(/\.?0+$/, "");
}

function pnlColor(n) {
  if (!n || isNaN(n)) return C.muted;
  return n >= 0 ? C.green : C.red;
}

// ─── Empty form state ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  symbol:         "",
  qty:            "",
  assetClass:     "equity",
  totalCostBasis: "",
  currency:       "CAD",
});

// ─── Modal ────────────────────────────────────────────────────────────────────
function HoldingModal({ mode, initial, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    if (!form.symbol.trim())                     return "Symbol is required.";
    if (!form.qty || isNaN(Number(form.qty)))    return "Quantity must be a number.";
    if (Number(form.qty) <= 0)                   return "Quantity must be > 0.";
    if (!form.totalCostBasis || isNaN(Number(form.totalCostBasis))) return "Cost basis must be a number.";
    if (Number(form.totalCostBasis) < 0)         return "Cost basis cannot be negative.";
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await onSave({
        symbol:         form.symbol.trim().toUpperCase(),
        qty:            Number(form.qty),
        assetClass:     form.assetClass,
        totalCostBasis: Number(form.totalCostBasis),
        currency:       form.currency,
      });
    } catch(e) {
      setError(e.message || "Save failed.");
      setSaving(false);
    }
  }

  const inputStyle = {
    background: "#0a0f1a", border: `1px solid ${C.border}`,
    borderRadius: 6, color: C.text, fontFamily: C.mono,
    fontSize: 13, padding: "8px 10px", width: "100%",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    color: C.muted, fontFamily: C.mono, textTransform: "uppercase",
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 28, width: 420,
        fontFamily: C.mono,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
            {mode === "add" ? "Add Holding" : "Edit Holding"}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.muted,
            fontSize: 18, cursor: "pointer", lineHeight: 1,
          }}>×</button>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Symbol */}
          <div>
            <label style={labelStyle}>Symbol</label>
            <input
              style={inputStyle}
              value={form.symbol}
              onChange={e => set("symbol", e.target.value.toUpperCase())}
              placeholder="e.g. NVDA, BTC"
              disabled={mode === "edit"}
            />
          </div>

          {/* Qty + Asset Class row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                style={inputStyle}
                value={form.qty}
                onChange={e => set("qty", e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                step="any"
              />
            </div>
            <div>
              <label style={labelStyle}>Asset Class</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.assetClass}
                onChange={e => set("assetClass", e.target.value)}
              >
                {ASSET_CLASSES.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost Basis + Currency row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Total Cost Basis</label>
              <input
                style={inputStyle}
                value={form.totalCostBasis}
                onChange={e => set("totalCostBasis", e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                step="any"
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.currency}
                onChange={e => set("currency", e.target.value)}
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 14, padding: "8px 12px",
            background: C.red + "18", border: `1px solid ${C.red}44`,
            borderRadius: 6, color: C.red, fontSize: 12,
          }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "space-between" }}>
          {mode === "edit" && (
            <button
              onClick={onDelete}
              style={{
                background: C.red + "18", border: `1px solid ${C.red}44`,
                color: C.red, borderRadius: 6, padding: "8px 16px",
                fontFamily: C.mono, fontSize: 12, cursor: "pointer", fontWeight: 600,
              }}
            >Delete</button>
          )}
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button onClick={onClose} style={{
              background: "none", border: `1px solid ${C.border}`,
              color: C.muted, borderRadius: 6, padding: "8px 16px",
              fontFamily: C.mono, fontSize: 12, cursor: "pointer",
            }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: C.accent, border: "none",
                color: "#fff", borderRadius: 6, padding: "8px 18px",
                fontFamily: C.mono, fontSize: 12, cursor: "pointer",
                fontWeight: 700, opacity: saving ? 0.6 : 1,
              }}
            >{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDelete({ symbol, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1100,
    }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.red}44`,
        borderRadius: 12, padding: 28, width: 360,
        fontFamily: C.mono, textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          Remove {symbol}?
        </div>
        <div style={{ color: C.subtext, fontSize: 12, marginBottom: 24 }}>
          This will permanently remove this holding from your portfolio. This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onCancel} style={{
            background: "none", border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 6, padding: "8px 20px",
            fontFamily: C.mono, fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: C.red, border: "none",
            color: "#fff", borderRadius: 6, padding: "8px 20px",
            fontFamily: C.mono, fontSize: 12, cursor: "pointer", fontWeight: 700,
          }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Portfolios() {
  const [holdings,    setHoldings]    = useState([]);
  const [valuation,   setValuation]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [modal,       setModal]       = useState(null); // null | { mode, holding }
  const [confirmDel,  setConfirmDel]  = useState(null); // null | symbol
  const [toast,       setToast]       = useState(null); // null | { msg, type }
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Load holdings + valuation ──────────────────────────────────────────────
  const load = useCallback(async (bust = false) => {
    setLoading(true);
    setError(null);
    try {
      if (bust) {
        await window.jupiter.invoke("holdings:invalidate");
      }
      const val = await window.jupiter.invoke("portfolio:getValuation");
      setValuation(val);

      // Extract holdings from positions
      const positions = val?.positions || [];
      setHoldings(positions);
    } catch(e) {
      setError(e.message || "Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Read holdings.json directly for editing ───────────────────────────────
  async function getRawHoldings() {
    const snap = await window.jupiter.invoke("portfolio:getSnapshot");
    // getSnapshot returns { portfolio: { positions } }
    // We need the raw holdings — use getValuation positions as proxy
    // Actually we'll use the IPC for raw holdings
    return await window.jupiter.invoke("holdings:getRaw");
  }

  // ── Save (add or update) ──────────────────────────────────────────────────
  async function handleSave(formData) {
    await window.jupiter.invoke("holdings:upsert", formData);
    await load(true);
    setModal(null);
    showToast(`${formData.symbol} saved successfully.`);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(symbol) {
    await window.jupiter.invoke("holdings:delete", { symbol });
    await load(true);
    setModal(null);
    setConfirmDel(null);
    showToast(`${symbol} removed from portfolio.`, "warn");
  }

  // ── Refresh live prices ───────────────────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true);
    await window.jupiter.invoke("holdings:invalidate");
    await load(true);
    setRefreshing(false);
    showToast("Prices refreshed.");
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalValue    = valuation?.totals?.liveValue   || 0;
  const totalCost     = holdings.reduce((s, h) => s + (h.totalCostBasis || 0), 0);
  const totalPnL      = totalValue - totalCost;
  const totalPnLPct   = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  const cell = (content, opts = {}) => (
    <td style={{
      padding: "12px 14px",
      fontSize: 12,
      fontFamily: C.mono,
      color: opts.color || C.text,
      borderBottom: `1px solid ${C.border}`,
      whiteSpace: "nowrap",
      textAlign: opts.right ? "right" : "left",
      ...opts.style,
    }}>{content}</td>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 32px", fontFamily: C.mono }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 2000,
          background: toast.type === "warn" ? C.yellow + "22" : C.green + "22",
          border: `1px solid ${toast.type === "warn" ? C.yellow : C.green}44`,
          color: toast.type === "warn" ? C.yellow : C.green,
          padding: "10px 18px", borderRadius: 8, fontSize: 12, fontFamily: C.mono,
          fontWeight: 600,
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
            Portfolio Manager
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            {holdings.length} holding{holdings.length !== 1 ? "s" : ""} · engine/data/users/default/holdings.json
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: "none", border: `1px solid ${C.border}`,
              color: C.subtext, borderRadius: 6, padding: "8px 14px",
              fontFamily: C.mono, fontSize: 11, cursor: "pointer",
              opacity: refreshing ? 0.5 : 1,
            }}
          >{refreshing ? "Refreshing…" : "↻ Refresh Prices"}</button>
          <button
            onClick={() => setModal({ mode: "add", holding: null })}
            style={{
              background: C.accent, border: "none",
              color: "#fff", borderRadius: 6, padding: "8px 16px",
              fontFamily: C.mono, fontSize: 11, cursor: "pointer", fontWeight: 700,
            }}
          >+ Add Holding</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Portfolio Value",  value: fmtCurrency(totalValue),               color: C.text   },
          { label: "Total Cost Basis", value: fmtCurrency(totalCost),                color: C.subtext },
          { label: "Unrealized P&L",   value: fmtCurrency(totalPnL),                 color: pnlColor(totalPnL) },
          { label: "Total Return",     value: totalPnLPct.toFixed(2) + "%",           color: pnlColor(totalPnLPct) },
        ].map(card => (
          <div key={card.label} style={{
            background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 12 }}>
            Loading portfolio…
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: C.red, fontSize: 12 }}>
            {error}
          </div>
        ) : holdings.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ color: C.subtext, fontSize: 13 }}>No holdings yet.</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
              Click "Add Holding" to get started.
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Symbol", "Type", "Qty", "Cost Basis", "Live Value", "P&L", "Return", "Currency", ""].map((h, i) => (
                  <th key={i} style={{
                    padding: "10px 14px",
                    fontSize: 10, fontWeight: 700,
                    color: C.muted, textAlign: i >= 3 ? "right" : "left",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    fontFamily: C.mono,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, idx) => {
                const liveVal   = h.liveValue        || 0;
                const costBasis = h.totalCostBasis   || 0;
                const pnl       = liveVal - costBasis;
                const pnlPct    = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                return (
                  <tr
                    key={h.symbol || idx}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ffffff08"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => setModal({ mode: "edit", holding: h })}
                  >
                    {cell(<span style={{ fontWeight: 700, color: C.text }}>{h.symbol}</span>)}
                    {cell(assetBadge(h.assetClass))}
                    {cell(fmtQty(h.qty),              { right: true })}
                    {cell(fmtCurrency(costBasis, h.currency), { right: true, color: C.subtext })}
                    {cell(fmtCurrency(liveVal,   h.currency), { right: true })}
                    {cell(
                      <span style={{ color: pnlColor(pnl) }}>
                        {pnl >= 0 ? "+" : ""}{fmtCurrency(pnl, h.currency)}
                      </span>,
                      { right: true }
                    )}
                    {cell(
                      <span style={{ color: pnlColor(pnlPct) }}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </span>,
                      { right: true }
                    )}
                    {cell(<span style={{ color: C.muted }}>{h.currency}</span>, { right: true })}
                    {cell(
                      <span style={{ color: C.muted, fontSize: 16 }}>›</span>,
                      { right: true, style: { width: 32 } }
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Allocation bar */}
      {!loading && holdings.length > 0 && totalValue > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Allocation
          </div>
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1 }}>
            {holdings.map((h, i) => {
              const pct = totalValue > 0 ? ((h.liveValue || 0) / totalValue) * 100 : 0;
              const hues = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#84cc16","#14b8a6"];
              return (
                <div
                  key={h.symbol}
                  title={`${h.symbol}: ${pct.toFixed(1)}%`}
                  style={{
                    width: `${pct}%`, background: hues[i % hues.length],
                    minWidth: pct > 0.5 ? 2 : 0,
                    transition: "width 0.3s",
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
            {holdings.map((h, i) => {
              const pct = totalValue > 0 ? ((h.liveValue || 0) / totalValue) * 100 : 0;
              const hues = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#84cc16","#14b8a6"];
              return (
                <span key={h.symbol} style={{ fontSize: 10, color: C.subtext, fontFamily: C.mono }}>
                  <span style={{ color: hues[i % hues.length], marginRight: 4 }}>■</span>
                  {h.symbol} {pct.toFixed(1)}%
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <HoldingModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? {
            symbol:         modal.holding.symbol,
            qty:            String(modal.holding.qty ?? ""),
            assetClass:     modal.holding.assetClass || "equity",
            totalCostBasis: String(modal.holding.totalCostBasis ?? ""),
            currency:       modal.holding.currency || "CAD",
          } : emptyForm()}
          onSave={handleSave}
          onDelete={() => setConfirmDel(modal.holding.symbol)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <ConfirmDelete
          symbol={confirmDel}
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
