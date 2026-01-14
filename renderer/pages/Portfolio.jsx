import { useEffect, useMemo, useState } from "react";

export default function Portfolio() {
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [addSymbol, setAddSymbol] = useState("");
  const [addQty, setAddQty] = useState("");
  const [editQty, setEditQty] = useState({});

  const positions = useMemo(
    () => (Array.isArray(valuation?.positions) ? valuation.positions : []),
    [valuation]
  );

  async function loadValuation() {
    const v = await window.jupiter.invoke("portfolio:getValuation");
    setValuation(v);

    setEditQty(prev => {
      const next = { ...prev };
      for (const p of v.positions || []) {
        if (next[p.symbol] === undefined) {
          next[p.symbol] = String(p.qty);
        }
      }
      return next;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadValuation();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function mutate(fn) {
    try {
      setBusy(true);
      setError(null);
      setNotice(null);
      await fn();
      await loadValuation(); // 🔒 single canonical refresh
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addHolding() {
    const symbol = addSymbol.trim().toUpperCase();
    const qty = Number(addQty);
    if (!symbol || !Number.isFinite(qty)) return;

    await mutate(async () => {
      try {
        await window.jupiter.invoke("portfolio:add", { symbol, qty });
      } catch (e) {
        if (e.message.includes("ALREADY_EXISTS")) {
          await window.jupiter.invoke("portfolio:update", { symbol, qty });
          setNotice(`Updated ${symbol}`);
          return;
        }
        throw e;
      }
      setAddSymbol("");
      setAddQty("");
      setNotice(`Added ${symbol}`);
    });
  }

  async function updateHolding(symbol) {
    const qty = Number(editQty[symbol]);
    if (!Number.isFinite(qty)) return;

    await mutate(async () => {
      await window.jupiter.invoke("portfolio:update", { symbol, qty });
      setNotice(`Updated ${symbol}`);
    });
  }

  async function removeHolding(symbol) {
    await mutate(async () => {
      await window.jupiter.invoke("portfolio:remove", { symbol });
      setNotice(`Removed ${symbol}`);
    });
  }

  const t = valuation?.totals || {};

  return (
    <div style={{ padding: 20 }}>
      <h1>Portfolio</h1>

      {error && <div style={{ color: "red" }}>{error}</div>}
      {notice && <div style={{ color: "lime" }}>{notice}</div>}

      <div style={{ marginBottom: 12 }}>
        <div>Currency: {valuation?.currency || "CAD"}</div>
        <div>Total Snapshot: ${t.snapshotValue?.toFixed(2)}</div>
        <div>Total Live: ${t.liveValue?.toFixed(2)}</div>
        <div>
          Δ: ${t.delta?.toFixed(2)} ({t.deltaPct?.toFixed(2)}%)
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Symbol"
          value={addSymbol}
          onChange={e => setAddSymbol(e.target.value)}
          disabled={busy}
        />
        <input
          placeholder="Qty"
          value={addQty}
          onChange={e => setAddQty(e.target.value)}
          disabled={busy}
        />
        <button onClick={addHolding} disabled={busy}>
          Add
        </button>
      </div>

      {loading ? (
        <div>Loading portfolio…</div>
      ) : (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Snapshot $</th>
              <th>Live Price</th>
              <th>Live $</th>
              <th>Δ</th>
              <th>Δ%</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>
                  <input
                    value={editQty[p.symbol]}
                    onChange={e =>
                      setEditQty(q => ({ ...q, [p.symbol]: e.target.value }))
                    }
                    disabled={busy}
                  />
                </td>
                <td>${p.snapshotValue.toFixed(2)}</td>
                <td>{p.livePrice.toFixed(4)}</td>
                <td>${p.liveValue.toFixed(2)}</td>
                <td>${p.delta.toFixed(2)}</td>
                <td>{p.deltaPct.toFixed(2)}%</td>
                <td>
                  <button
                    onClick={() => updateHolding(p.symbol)}
                    disabled={busy}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => removeHolding(p.symbol)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
