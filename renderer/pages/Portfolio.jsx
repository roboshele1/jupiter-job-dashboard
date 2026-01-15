import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "JUPITER_PORTFOLIO_UI_V3_STATE";

/**
 * Renderer-only contract:
 * - Reads snapshot once (portfolio:getSnapshot)
 * - UI edits are persisted in localStorage so tab switches do NOT revert
 * - No IPC mutations. No engine access.
 */

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

function readUiState() {
  return safeJsonParse(localStorage.getItem(STORAGE_KEY), {
    version: 3,
    updatedAt: 0,
    qtyBySymbol: {},     // { [symbol]: number }
    removedSymbols: [],  // string[]
    addedSymbols: {}     // { [symbol]: { qty:number } }
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

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  // UI state (persisted)
  const [uiState, setUiState] = useState(() => {
    // localStorage exists in renderer; safe lazy init
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

  // Transient UI inputs
  const [status, setStatus] = useState(null);
  const [rowDraftQty, setRowDraftQty] = useState({}); // { [symbol]: string }
  const [addSymbol, setAddSymbol] = useState("");
  const [addQty, setAddQty] = useState("");

  /* =========================
     SNAPSHOT LOAD (ONCE)
     ========================= */
  useEffect(() => {
    async function loadSnapshot() {
      try {
        if (!window.jupiter?.invoke) {
          throw new Error("IPC bridge not available");
        }

        const snap = await window.jupiter.invoke("portfolio:getSnapshot");
        setSnapshot(snap);

        // Initialize draft qty fields from hydrated view (after snapshot exists)
        const basePositions = Array.isArray(snap?.portfolio?.positions)
          ? snap.portfolio.positions
          : [];

        // Build initial drafts from base snapshot qty (string)
        const initialDrafts = {};
        for (const p of basePositions) {
          if (p?.symbol) initialDrafts[p.symbol] = String(p.qty ?? "");
        }

        // Apply any persisted qty overrides / additions so drafts match visible values
        const removed = new Set(uiState.removedSymbols || []);
        const mergedDrafts = { ...initialDrafts };

        // Overrides
        for (const [sym, qty] of Object.entries(uiState.qtyBySymbol || {})) {
          if (!removed.has(sym)) mergedDrafts[sym] = String(qty);
        }

        // Added
        for (const [sym, payload] of Object.entries(uiState.addedSymbols || {})) {
          if (!removed.has(sym)) mergedDrafts[sym] = String(payload?.qty ?? "");
        }

        setRowDraftQty(mergedDrafts);
      } catch (err) {
        console.error("[PORTFOLIO_LOAD_ERROR]", err);
        setError(err.message);
      }
    }

    loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // IMPORTANT: one-time load only

  /* =========================
     PERSIST UI STATE
     ========================= */
  useEffect(() => {
    try {
      writeUiState(uiState);
    } catch {
      // If storage fails, we still keep in-memory state
    }
  }, [uiState]);

  /* =========================
     BUILD VISIBLE POSITIONS
     Snapshot + UI overlays
     ========================= */
  const visiblePositions = useMemo(() => {
    const base = Array.isArray(snapshot?.portfolio?.positions)
      ? snapshot.portfolio.positions
      : [];

    const removed = new Set(uiState.removedSymbols || []);
    const qtyBySymbol = uiState.qtyBySymbol || {};
    const added = uiState.addedSymbols || {};

    // Start from snapshot positions
    const merged = [];
    for (const p of base) {
      const sym = p?.symbol;
      if (!sym) continue;
      if (removed.has(sym)) continue;

      const overrideQty = qtyBySymbol[sym];
      const qty =
        typeof overrideQty === "number" && Number.isFinite(overrideQty)
          ? overrideQty
          : p.qty;

      merged.push({
        ...p,
        qty
      });
    }

    // Add renderer-only new symbols (no pricing fields; keep safe fallbacks)
    for (const [sym, payload] of Object.entries(added)) {
      if (!sym) continue;
      if (removed.has(sym)) continue;

      // Avoid duplicates if symbol exists in snapshot list already
      const exists = merged.some(m => m.symbol === sym);
      if (exists) continue;

      const qty = Number(payload?.qty);
      merged.push({
        symbol: sym,
        qty: Number.isFinite(qty) ? qty : 0,
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
  }, [snapshot, uiState]);

  /* =========================
     ACTIONS (renderer-only)
     ========================= */
  function setDraft(symbol, value) {
    setRowDraftQty(prev => ({ ...prev, [symbol]: value }));
  }

  function handleUpdate(symbol) {
    const raw = rowDraftQty[symbol];
    const qty = Number(raw);

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
    setUiState(prev => {
      const removed = new Set(prev.removedSymbols || []);
      removed.add(symbol);

      const nextQtyBySymbol = { ...(prev.qtyBySymbol || {}) };
      delete nextQtyBySymbol[symbol];

      const nextAdded = { ...(prev.addedSymbols || {}) };
      delete nextAdded[symbol];

      return {
        ...prev,
        removedSymbols: Array.from(removed),
        qtyBySymbol: nextQtyBySymbol,
        addedSymbols: nextAdded
      };
    });

    setStatus(`Removed ${symbol}`);
  }

  function handleAdd() {
    const sym = normalizeSymbol(addSymbol);
    const qty = Number(addQty);

    if (!sym) {
      setStatus("Invalid symbol");
      return;
    }
    if (!isValidQty(qty)) {
      setStatus("Invalid qty");
      return;
    }

    // If user previously removed it, un-remove it
    setUiState(prev => {
      const removed = new Set(prev.removedSymbols || []);
      removed.delete(sym);

      const nextAdded = { ...(prev.addedSymbols || {}) };
      nextAdded[sym] = { qty };

      return {
        ...prev,
        removedSymbols: Array.from(removed),
        addedSymbols: nextAdded
      };
    });

    // Ensure draft shows the new qty
    setRowDraftQty(prev => ({ ...prev, [sym]: String(qty) }));

    setAddSymbol("");
    setAddQty("");
    setStatus(`Added ${sym}`);
  }

  /* =========================
     RENDER
     ========================= */
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!snapshot) return <div>Loading portfolio…</div>;

  const portfolio = snapshot.portfolio || {};
  const asOf =
    typeof portfolio._asOf === "number"
      ? new Date(portfolio._asOf).toLocaleString()
      : "—";

  return (
    <div>
      <h1>Portfolio</h1>

      {status && (
        <div style={{ color: "lime", marginBottom: 10 }}>
          {status}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        Currency: {portfolio.currency || "CAD"}<br />
        As-Of: {asOf}<br />
        Total Snapshot: $
        {portfolio?.totals?.snapshotValue != null
          ? Number(portfolio.totals.snapshotValue).toFixed(2)
          : "—"}
        <br />
        Total Live: $
        {portfolio?.totals?.liveValue != null
          ? Number(portfolio.totals.liveValue).toFixed(2)
          : "—"}
        <br />
        Δ: $
        {portfolio?.totals?.delta != null
          ? Number(portfolio.totals.delta).toFixed(2)
          : "—"}
        {" "}
        (
        {portfolio?.totals?.deltaPct != null
          ? Number(portfolio.totals.deltaPct).toFixed(2)
          : "—"}
        %)
      </div>

      {/* ADD BAR */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input
          placeholder="Symbol"
          value={addSymbol}
          onChange={e => setAddSymbol(e.target.value)}
          style={{ width: 140 }}
        />
        <input
          placeholder="Qty"
          value={addQty}
          onChange={e => setAddQty(e.target.value)}
          style={{ width: 140 }}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <table border="1" cellPadding="6" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Snapshot $</th>
            <th>Live Price</th>
            <th>Live $</th>
            <th>Δ</th>
            <th>Δ%</th>
            <th>Source</th>
            <th>Freshness</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visiblePositions.map(p => {
            const sym = p.symbol;
            const draft = rowDraftQty[sym] ?? String(p.qty ?? "");

            return (
              <tr key={sym}>
                <td>{sym}</td>

                <td>
                  <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(sym, e.target.value)}
                    style={{ width: 90 }}
                  />
                </td>

                <td>${Number(p.snapshotValue ?? 0).toFixed(2)}</td>
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

                <td>
                  <button onClick={() => handleUpdate(sym)} style={{ marginRight: 8 }}>
                    Update
                  </button>
                  <button onClick={() => handleRemove(sym)}>
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
