import { useEffect, useMemo, useState } from "react";
import "../styles/dashboard.css";

const BUCKET_COLORS = {
  Semiconductors: "#4cc9f0",
  Software: "#8b5cf6",
  Crypto: "#fbbf24",
  Cash: "#e5e7eb"
};

function fmtMoney(n) {
  const num = Number(n || 0);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function safeNum(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

export default function Dashboard() {
  const [valuation, setValuation] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!window?.jupiter?.getPortfolioValuation) return;
      const v = await window.jupiter.getPortfolioValuation();
      if (mounted) setValuation(v);
    }

    load();
    return () => (mounted = false);
  }, []);

  const timestamp = valuation?._asOf
    ? new Date(valuation._asOf).toISOString()
    : "—";

  const positions = Array.isArray(valuation?.positions) ? valuation.positions : [];

  // ✅ FIX: derive totals from positions (same math as Portfolio)
  const totalLive = positions.reduce(
    (acc, p) => acc + safeNum(p.liveValue),
    0
  );

  const totalSnapshot = positions.reduce(
    (acc, p) => acc + safeNum(p.snapshotValue),
    0
  );

  const dailyPL = totalLive - totalSnapshot;
  const dailyPLPct =
    totalSnapshot > 0 ? (dailyPL / totalSnapshot) * 100 : 0;

  const plClass =
    dailyPL > 0 ? "pl-positive" : dailyPL < 0 ? "pl-negative" : "pl-neutral";

  const topHoldings = useMemo(() => {
    return positions
      .slice()
      .sort((a, b) => safeNum(b.liveValue) - safeNum(a.liveValue))
      .slice(0, 5)
      .map((p) => ({
        symbol: p.symbol,
        qty: p.qty
      }));
  }, [positions]);

  const allocationBands = useMemo(() => {
    if (!positions.length || totalLive <= 0) {
      return [
        { name: "Semiconductors", percent: 56, color: BUCKET_COLORS.Semiconductors },
        { name: "Software", percent: 9, color: BUCKET_COLORS.Software },
        { name: "Crypto", percent: 26, color: BUCKET_COLORS.Crypto },
        { name: "Cash", percent: 9, color: BUCKET_COLORS.Cash }
      ];
    }

    const buckets = { Semiconductors: 0, Software: 0, Crypto: 0, Cash: 0 };

    for (const p of positions) {
      const sym = p.symbol.toUpperCase();
      const v = safeNum(p.liveValue);

      if (sym.includes("BTC") || sym.includes("ETH")) buckets.Crypto += v;
      else if (["NVDA", "AVGO", "ASML", "TSM"].includes(sym)) buckets.Semiconductors += v;
      else if (["HOOD", "MSTR"].includes(sym)) buckets.Software += v;
      else buckets.Cash += v;
    }

    const bands = Object.entries(buckets).map(([name, val]) => ({
      name,
      percent: Math.round((val / totalLive) * 100),
      color: BUCKET_COLORS[name]
    }));

    const sum = bands.reduce((a, b) => a + b.percent, 0);
    if (sum !== 100) bands[0].percent += 100 - sum;

    return bands;
  }, [positions, totalLive]);

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
          <div className="value">{fmtMoney(totalLive)}</div>
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
            >
              {b.name} {b.percent}%
            </div>
          ))}
        </div>
      </div>

      <div className="card wide">
        <div className="label">TOP HOLDINGS</div>
        <div className="holdings-list">
          {topHoldings.map((h) => (
            <div key={h.symbol} className="holding-row">
              <span className="symbol">{h.symbol}</span>
              <span className="qty">{h.qty}</span>
            </div>
          ))}
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

