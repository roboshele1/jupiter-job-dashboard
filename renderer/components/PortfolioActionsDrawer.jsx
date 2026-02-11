import { useEffect, useState } from "react";

/**
 * PortfolioActionsDrawer — EXECUTION ENABLED (CANONICAL)
 * -----------------------------------------------------
 * FIX (authoritative, non-regressing):
 * - Calls the correct IPC channels:
 *     portfolio:add | portfolio:update | portfolio:remove
 * - Enforces cost basis for NEW holdings:
 *     add requires { symbol, qty, cost }
 * - Update uses QTY DELTA model:
 *     update requires { symbol, qtyDelta }
 * - Reads existing holdings from snapshot.positions (engine snapshot),
 *   but also tolerates snapshot.portfolio.positions if present.
 */

function asNum(v) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

export default function PortfolioActionsDrawer({ open, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const [newSymbol, setNewSymbol] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newCost, setNewCost] = useState("");

  const [editQtyDelta, setEditQtyDelta] = useState({});

  async function loadSnapshot() {
    try {
      const snap = await window.jupiter.invoke("portfolio:getSnapshot");
      setSnapshot(snap);
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  useEffect(() => {
    if (open) {
      setError(null);
      setStatus(null);
      loadSnapshot();
    }
  }, [open]);

  if (!open) return null;

  // Engine snapshot is: { timestamp, positions: [...] }
  // Some other screens may pass: { portfolio: { positions: [...] } }
  const positions =
    snapshot?.positions ||
    snapshot?.portfolio?.positions ||
    [];

  async function handleAdd() {
    try {
      setError(null);
      setStatus(null);

      const symbol = String(newSymbol || "").trim().toUpperCase();
      const qty = asNum(newQty);
      const cost = asNum(newCost);

      if (!symbol) throw new Error("SYMBOL_REQUIRED");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("INVALID_QTY");
      if (!Number.isFinite(cost) || cost <= 0) throw new Error("INVALID_COST");

      await window.jupiter.invoke("portfolio:add", { symbol, qty, cost });

      setNewSymbol("");
      setNewQty("");
      setNewCost("");
      await loadSnapshot();
      setStatus(`Added ${symbol}`);
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  async function handleUpdate(symbol) {
    try {
      setError(null);
      setStatus(null);

      const qtyDelta = asNum(editQtyDelta[symbol]);

      if (!Number.isFinite(qtyDelta) || qtyDelta === 0) {
        throw new Error("INVALID_QTY_DELTA");
      }

      await window.jupiter.invoke("portfolio:update", { symbol, qtyDelta });

      await loadSnapshot();
      setStatus(`Updated ${symbol}`);
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  async function handleRemove(symbol) {
    try {
      setError(null);
      setStatus(null);

      await window.jupiter.invoke("portfolio:remove", { symbol });

      await loadSnapshot();
      setStatus(`Removed ${symbol}`);
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100%",
        background: "#0f172a",
        borderLeft: "1px solid #1e293b",
        padding: 20,
        zIndex: 1000,
        overflowY: "auto"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Portfolio Actions</strong>
        <button onClick={onClose}>Close</button>
      </div>

      {error && (
        <div style={{ marginTop: 10, color: "#ef4444", fontSize: 12 }}>
          {error}
        </div>
      )}
      {status && (
        <div style={{ marginTop: 10, color: "#22c55e", fontSize: 12 }}>
          {status}
        </div>
      )}

      {/* ADD */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Add Holding</div>

        <input
          placeholder="Symbol (e.g. MSFT)"
          value={newSymbol}
          onChange={e => setNewSymbol(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />

        <input
          placeholder="Qty (e.g. 10)"
          value={newQty}
          onChange={e => setNewQty(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />

        <input
          placeholder="Total Cost Basis (e.g. 1043.40)"
          value={newCost}
          onChange={e => setNewCost(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />

        <button style={{ marginTop: 8 }} onClick={handleAdd}>
          Add
        </button>
      </div>

      {/* EXISTING */}
      <div style={{ marginTop: 30 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          Existing Holdings
        </div>

        {positions.map(p => (
          <div
            key={p.symbol}
            style={{
              border: "1px solid #1e293b",
              borderRadius: 6,
              padding: 10,
              marginBottom: 10,
              fontSize: 13
            }}
          >
            <div style={{ fontWeight: 600 }}>{p.symbol}</div>
            <div style={{ opacity: 0.7 }}>Qty: {p.qty}</div>

            <input
              placeholder="Qty Delta (+ / -)"
              value={editQtyDelta[p.symbol] ?? ""}
              onChange={e =>
                setEditQtyDelta(prev => ({
                  ...prev,
                  [p.symbol]: e.target.value
                }))
              }
              style={{ width: "100%", marginTop: 6 }}
            />

            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={() => handleUpdate(p.symbol)}>Update</button>
              <button onClick={() => handleRemove(p.symbol)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
