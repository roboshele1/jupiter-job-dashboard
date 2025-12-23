import { useEffect, useMemo, useState } from "react";
import * as snapshotStore from "../state/snapshotStore";
import "../styles/portfolio.css";

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function fmtMoney(n) {
  const num = safeNum(n);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pickSnapshot() {
  try {
    if (typeof snapshotStore.getLatestSnapshot === "function") return snapshotStore.getLatestSnapshot() || {};
    if (typeof snapshotStore.getSnapshot === "function") return snapshotStore.getSnapshot() || {};
    if (typeof snapshotStore.default === "function") return snapshotStore.default() || {};
    return {};
  } catch {
    return {};
  }
}

export default function Portfolio() {
  const [snap, setSnap] = useState({});

  useEffect(() => {
    const s = pickSnapshot();
    setSnap(s);
  }, []);

  const holdings = Array.isArray(snap.holdings) ? snap.holdings : [];

  const totalValue = safeNum(snap.totalValue);

  const allocation = snap.allocation || {};
  const equityPct = safeNum(allocation.Equity);
  const digitalPct = safeNum(allocation.Digital);

  const rows = useMemo(() => {
    return holdings.map((h) => {
      const symbol = (h.symbol || h.ticker || h.asset || "—").toUpperCase();
      const qty = safeNum(h.qty ?? h.quantity ?? h.shares ?? 0);
      const price = safeNum(h.price ?? h.last ?? h.lastPrice ?? 0);
      const value = safeNum(h.value ?? h.marketValue ?? h.market_value ?? 0);

      return { symbol, qty, price, value };
    });
  }, [holdings]);

  return (
    <div className="portfolio-page">
      <h1>Portfolio</h1>

      <div className="portfolio-cards">
        <div className="card">
          <span className="label">Total Value</span>
          <span className="value">{fmtMoney(totalValue)}</span>
        </div>

        <div className="card">
          <span className="label">Equities</span>
          <span className="value">{equityPct.toFixed(2)}%</span>
        </div>

        <div className="card">
          <span className="label">Digital Assets</span>
          <span className="value">{digitalPct.toFixed(2)}%</span>
        </div>
      </div>

      <div className="card table-card">
        <h2>Holdings</h2>

        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="4" className="muted">
                  No holdings found in snapshot.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.symbol}>
                  <td>{r.symbol}</td>
                  <td>{r.qty}</td>
                  <td>{fmtMoney(r.price)}</td>
                  <td>{fmtMoney(r.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

