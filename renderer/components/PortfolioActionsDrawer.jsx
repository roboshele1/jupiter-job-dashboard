import { useEffect, useState } from "react";

/**
 * PortfolioActionsDrawer — EXECUTION ENABLED (FIXED)
 * --------------------------------------------------
 * FIXES:
 * - Correct IPC payload shape
 * - Deterministic add / update / remove
 * - Independent qty per holding
 * - Existing holdings load correctly
 */

export default function PortfolioActionsDrawer({ open, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const [newSymbol, setNewSymbol] = useState("");
  const [newQty, setNewQty] = useState("");

  const [editQty, setEditQty] = useState({}); // per-symbol qty

  async function loadSnapshot() {
    try {
      const snap = await window.jupiter.invoke("portfolio:getSnapshot");
      setSnapshot(snap);
    } catch (err) {
      setError(err.message);
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

  const positions = snapshot?.positions || [];

  async function handleAdd() {
    try {
      setError(null);
      setStatus(null);

      await window.jupiter.invoke("portfolio:addHolding", {
        symbol: newSymbol.trim().toUpperCase(),
        qty: Number(newQty)
      });

      setNewSymbol("");
      setNewQty("");
      await loadSnapshot();
      setStatus("Holding added");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(symbol) {
    try {
      setError(null);
      setStatus(null);

      await window.jupiter.invoke("portfolio:updateHolding", {
        symbol,
        qty: Number(editQty[symbol])
      });

      await loadSnapshot();
      setStatus(`Updated ${symbol}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(symbol) {
    try {
      setError(null);
      setStatus(null);

      await window.jupiter.invoke("portfolio:removeHolding", {
        symbol
      });

      await loadSnapshot();
      setStatus(`Removed ${symbol}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 380,
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
          placeholder="Qty"
          value={newQty}
          onChange={e => setNewQty(e.target.value)}
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
              placeholder="New Qty"
              value={editQty[p.symbol] ?? ""}
              onChange={e =>
                setEditQty(prev => ({
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
