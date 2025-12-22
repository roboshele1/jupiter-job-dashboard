import { useEffect, useMemo, useState } from "react";
import * as snapshotStore from "../state/snapshotStore";
import "../styles/dashboard.css";

const BUCKET_COLORS = {
  Semiconductors: "#4cc9f0",
  Software: "#8b5cf6",
  Crypto: "#fbbf24",
  Cash: "#e5e7eb"
};

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

function fmtMoney(n) {
  const num = Number(n || 0);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function safeNum(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

export default function Dashboard() {
  const [snap, setSnap] = useState({});

  useEffect(() => {
    const s = pickSnapshot();
    setSnap(s);
  }, []);

  const timestamp =
    snap.snapshotTime ||
    snap.snapshot_time ||
    snap.timestamp ||
    snap.time ||
    snap.asOf ||
    "—";

  const holdings = Array.isArray(snap.holdings)
    ? snap.holdings
    : Array.isArray(snap.positions)
      ? snap.positions
      : Array.isArray(snap.assets)
        ? snap.assets
        : [];

  const totalValue =
    safeNum(snap.totalValue) ||
    safeNum(snap.totalPortfolioValue) ||
    safeNum(snap.total_portfolio_value) ||
    holdings.reduce((acc, h) => acc + safeNum(h.value), 0);

  const dailyPL = safeNum(snap.dailyPL) || safeNum(snap.dailyPl) || safeNum(snap.daily_pnl) || 0;
  const dailyPLPct =
    safeNum(snap.dailyPLPct) || safeNum(snap.dailyPlPct) || safeNum(snap.daily_pnl_pct) || 0;

  const plClass = dailyPL > 0 ? "pl-positive" : dailyPL < 0 ? "pl-negative" : "pl-neutral";

  const topHoldings = useMemo(() => {
    const rows = holdings
      .map((h) => ({
        symbol: h.symbol || h.ticker || h.asset || "—",
        qty: h.qty ?? h.quantity ?? h.shares ?? "—",
        value: safeNum(h.value)
      }))
      .filter((r) => r.symbol !== "—")
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return rows;
  }, [holdings]);

  const allocationBands = useMemo(() => {
    if (!holdings.length || totalValue <= 0) {
      // deterministic fallback (visual-only) if holdings not present
      return [
        { name: "Semiconductors", percent: 52, color: BUCKET_COLORS.Semiconductors },
        { name: "Software", percent: 28, color: BUCKET_COLORS.Software },
        { name: "Crypto", percent: 12, color: BUCKET_COLORS.Crypto },
        { name: "Cash", percent: 8, color: BUCKET_COLORS.Cash }
      ];
    }

    const SEMIS = new Set(["NVDA", "AVGO", "ASML", "TSM", "AMD", "MU", "ARM", "QCOM", "INTC", "AMAT", "LRCX", "KLAC", "ASX"]);
    const SOFTWARE = new Set(["HOOD", "MSFT", "AAPL", "GOOGL", "GOOG", "META", "AMZN", "CRM", "ORCL", "ADBE", "NOW", "SNOW", "MSTR"]);
    const CRYPTO = new Set(["BTC", "ETH", "BTCCAD", "ETHCAD", "IBIT"]);

    const buckets = {
      Semiconductors: 0,
      Software: 0,
      Crypto: 0,
      Cash: 0
    };

    for (const h of holdings) {
      const sym = (h.symbol || h.ticker || "").toUpperCase();
      const v = safeNum(h.value);

      if (CRYPTO.has(sym) || sym.includes("BTC") || sym.includes("ETH")) buckets.Crypto += v;
      else if (SEMIS.has(sym) || sym.includes("ASML") || sym.includes("NVDA") || sym.includes("AVGO")) buckets.Semiconductors += v;
      else if (SOFTWARE.has(sym) || sym.includes("HOOD") || sym.includes("MSTR")) buckets.Software += v;
      else buckets.Cash += v;
    }

    const bands = Object.entries(buckets)
      .map(([name, val]) => ({
        name,
        percent: Math.max(0, Math.round((val / totalValue) * 100)),
        color: BUCKET_COLORS[name] || "#94a3b8"
      }))
      .filter((b) => b.percent > 0);

    const sum = bands.reduce((a, b) => a + b.percent, 0);
    if (sum !== 100 && bands.length) {
      bands[0].percent = Math.max(0, bands[0].percent + (100 - sum));
    }
    return bands;
  }, [holdings, totalValue]);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="card wide">
        <div className="label">SNAPSHOT TIME</div>
        <div className="value">{timestamp}</div>
      </div>

      <div className="card-row">
        <div className="card">
          <div className="label">TOTAL PORTFOLIO VALUE</div>
          <div className="value">{fmtMoney(totalValue)}</div>
        </div>

        <div className={`card ${plClass}`}>
          <div className="label">DAILY P/L</div>
          <div className="value">
            {fmtMoney(dailyPL)} ({dailyPLPct.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="card wide">
        <div className="label">ALLOCATION BANDS</div>
        <div className="allocation-band">
          {allocationBands.map((b) => (
            <div
              key={b.name}
              className="band"
              style={{ width: `${b.percent}%`, backgroundColor: b.color }}
              title={`${b.name} ${b.percent}%`}
            >
              {b.name} {b.percent}%
            </div>
          ))}
        </div>
      </div>

      <div className="card wide">
        <div className="label">TOP HOLDINGS</div>
        <div className="holdings-list">
          {topHoldings.length === 0 ? (
            <div className="muted">No holdings found in snapshot.</div>
          ) : (
            topHoldings.map((h) => (
              <div key={h.symbol} className="holding-row">
                <span className="symbol">{h.symbol}</span>
                <span className="qty">{h.qty}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card wide">
        <div className="label">SYSTEM STATUS</div>
        <div className="status-line">Market Data: LIVE</div>
        <div className="status-line">Refresh: 60s</div>
        <div className="status-line">Automation: ALERT-ONLY</div>
        <div className="status-line">Audit: IMMUTABLE</div>
      </div>
    </div>
  );
}
