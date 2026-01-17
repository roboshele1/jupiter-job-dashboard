import { useEffect, useMemo, useState } from "react";
import "../styles/dashboard.css";

const STORAGE_KEY = "JUPITER_PORTFOLIO_UI_V3_STATE";

const BUCKET_COLORS = {
  Semiconductors: "#4cc9f0",
  Software: "#8b5cf6",
  Crypto: "#fbbf24",
  Cash: "#e5e7eb",
};

function fmtMoney(n) {
  const num = Number(n || 0);
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeNum(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

function readPortfolioUiState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Market data freshness precedence.
 * (UI-only inference; does NOT change any engine logic.)
 */
const FRESHNESS_RANK = {
  LIVE: 3,
  DELAYED: 2,
  STALE: 1,
  UNKNOWN: 0,
};

function pickBestFreshness(positions) {
  let best = { level: "UNKNOWN", confidence: "UNKNOWN" };
  let bestRank = 0;

  for (const p of positions || []) {
    const level = p?.priceFreshness?.level || "UNKNOWN";
    const confidence = p?.priceFreshness?.confidence || "UNKNOWN";
    const rank = FRESHNESS_RANK[level] ?? 0;

    if (rank > bestRank) {
      bestRank = rank;
      best = { level, confidence };
    }
  }

  return best;
}

export default function Dashboard() {
  const [valuation, setValuation] = useState(null);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  // ✅ DASHBOARD LIVE REFRESH (lightweight polling)
  // Mirrors the “autonomous feel” without needing app restarts.
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        if (!window?.jupiter?.getPortfolioValuation) return;
        const v = await window.jupiter.getPortfolioValuation();
        if (!alive) return;
        setValuation(v);
        setLastRefreshAt(new Date());
      } catch (e) {
        // Dashboard should fail soft (read-only surface)
        console.error("[DASHBOARD_VALUATION_LOAD_ERROR]", e);
      }
    }

    load();

    // 15s gives “current” without being noisy.
    const id = setInterval(load, 15_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const uiState = useMemo(() => readPortfolioUiState(), []);

  /* =========================
     PORTFOLIO NORMALIZATION
     ========================= */
  const positions = useMemo(() => {
    const base = Array.isArray(valuation?.positions) ? valuation.positions : [];
    if (!uiState) return base;

    const removed = new Set(uiState.removedSymbols || []);
    const overrides = uiState.qtyBySymbol || {};
    const added = uiState.addedSymbols || {};

    const merged = [];

    for (const p of base) {
      if (!p?.symbol) continue;
      if (removed.has(p.symbol)) continue;

      const overrideQty = overrides[p.symbol];
      merged.push({
        ...p,
        qty:
          typeof overrideQty === "number" && Number.isFinite(overrideQty)
            ? overrideQty
            : p.qty,
      });
    }

    for (const [symbol, payload] of Object.entries(added)) {
      if (removed.has(symbol)) continue;
      if (merged.some((m) => m.symbol === symbol)) continue;

      merged.push({
        symbol,
        qty: Number(payload?.qty) || 0,
        assetClass: payload?.assetClass || "unknown",
        snapshotValue: 0,
        livePrice: 0,
        liveValue: 0,
        delta: 0,
        deltaPct: 0,
        priceSource: "ui-only",
        priceFreshness: null,
      });
    }

    return merged;
  }, [valuation, uiState]);

  /* =========================
     VALUATION METRICS
     ========================= */
  const totalLive = positions.reduce((a, p) => a + safeNum(p.liveValue), 0);
  const totalSnapshot = positions.reduce(
    (a, p) => a + safeNum(p.snapshotValue),
    0
  );

  const dailyPL = totalLive - totalSnapshot;
  const dailyPLPct = totalSnapshot > 0 ? (dailyPL / totalSnapshot) * 100 : 0;

  const plClass =
    dailyPL > 0 ? "pl-positive" : dailyPL < 0 ? "pl-negative" : "pl-neutral";

  /* =========================
     SNAPSHOT + FRESHNESS
     ========================= */
  const snapshotTime =
    valuation?.priceSnapshotMeta?.fetchedAt || valuation?.snapshotAt || null;

  // Engine-level freshness (if present)
  const engineFreshnessLevel =
    valuation?.priceSnapshotMeta?.freshness?.level || "UNKNOWN";
  const engineFreshnessConfidence =
    valuation?.priceSnapshotMeta?.freshness?.confidence || "UNKNOWN";

  // UI-level best-effort freshness from positions (prevents “UNKNOWN for days”)
  const bestFromPositions = useMemo(
    () => pickBestFreshness(positions),
    [positions]
  );

  const chosenFreshness =
    engineFreshnessLevel !== "UNKNOWN"
      ? { level: engineFreshnessLevel, confidence: engineFreshnessConfidence }
      : bestFromPositions;

  const marketStatus =
    chosenFreshness.level === "LIVE"
      ? "LIVE"
      : chosenFreshness.level === "DELAYED"
      ? "DELAYED"
      : chosenFreshness.level === "STALE"
      ? "STALE"
      : "UNKNOWN";

  /* =========================
     TOP HOLDINGS
     ========================= */
  const topHoldings = useMemo(
    () =>
      positions
        .slice()
        .sort((a, b) => safeNum(b.liveValue) - safeNum(a.liveValue))
        .slice(0, 5)
        .map((p) => ({ symbol: p.symbol, qty: p.qty })),
    [positions]
  );

  /* =========================
     ALLOCATION (INSTITUTIONAL)
     ========================= */
  const allocationBands = useMemo(() => {
    if (!positions.length || totalLive <= 0) {
      return [
        {
          name: "Semiconductors",
          percent: 56,
          color: BUCKET_COLORS.Semiconductors,
        },
        { name: "Software", percent: 9, color: BUCKET_COLORS.Software },
        { name: "Crypto", percent: 26, color: BUCKET_COLORS.Crypto },
        { name: "Cash", percent: 9, color: BUCKET_COLORS.Cash },
      ];
    }

    const buckets = {
      Semiconductors: 0,
      Software: 0,
      Crypto: 0,
      Cash: 0,
    };

    for (const p of positions) {
      const v = safeNum(p.liveValue);
      const cls = (p.assetClass || "").toLowerCase();
      const sym = (p.symbol || "").toUpperCase();

      if (cls === "crypto" || sym.includes("BTC") || sym.includes("ETH"))
        buckets.Crypto += v;
      else if (["NVDA", "AVGO", "ASML", "TSM"].includes(sym))
        buckets.Semiconductors += v;
      else if (["HOOD", "MSTR"].includes(sym))
        buckets.Software += v;
      else buckets.Cash += v;
    }

    const bands = Object.entries(buckets).map(([name, val]) => ({
      name,
      percent: Math.round((val / totalLive) * 100),
      color: BUCKET_COLORS[name],
    }));

    const sum = bands.reduce((a, b) => a + b.percent, 0);
    if (sum !== 100) bands[0].percent += 100 - sum;

    return bands;
  }, [positions, totalLive]);

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Readability-first: show “last refreshed” (always current if polling works) */}
      <div className="card wide">
        <div className="label">LAST REFRESHED</div>
        <div className="value">
          {lastRefreshAt ? lastRefreshAt.toLocaleString() : "—"}
        </div>
      </div>

      {snapshotTime && (
        <div className="card wide">
          <div className="label">SNAPSHOT TIME</div>
          <div className="value">{new Date(snapshotTime).toLocaleString()}</div>
        </div>
      )}

      <div className="card wide">
        <div className="label">TOTAL PORTFOLIO VALUE</div>
        <div className="value">{fmtMoney(totalLive)}</div>
      </div>

      <div className={`card wide ${plClass}`}>
        <div className="label">TODAY’S P/L</div>
        <div className="value">
          {fmtMoney(dailyPL)} ({dailyPLPct.toFixed(2)}%)
        </div>
      </div>

      <div className="card wide">
        <div className="label">PORTFOLIO ALLOCATION</div>
        <div className="allocation-band">
          {allocationBands.map((b) => (
            <div
              key={b.name}
              className="band"
              style={{
                width: `${b.percent}%`,
                backgroundColor: b.color,
              }}
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
        <div className="value">
          Market Data:{" "}
          <strong
            style={{
              color:
                marketStatus === "LIVE"
                  ? "#22c55e"
                  : marketStatus === "DELAYED"
                  ? "#60a5fa"
                  : marketStatus === "STALE"
                  ? "#facc15"
                  : "#9ca3af",
            }}
          >
            {marketStatus}
          </strong>
          <span style={{ opacity: 0.6, marginLeft: 8, fontSize: 12 }}>
            ({chosenFreshness.level}
            {chosenFreshness.confidence
              ? ` • ${chosenFreshness.confidence}`
              : ""}
            )
          </span>
        </div>
      </div>
    </div>
  );
}
