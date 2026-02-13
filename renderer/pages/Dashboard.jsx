import { useEffect, useMemo, useState } from "react";
import "../styles/dashboard.css";

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

/**
 * Market data freshness precedence.
 * (UI-only inference; does NOT change engine logic.)
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

  // 🟢 NEW — System State (dashboard card)
  const [systemState, setSystemState] = useState(null);

  // =========================
  // LOAD ENGINE VALUATION
  // =========================
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
        console.error("[DASHBOARD_VALUATION_LOAD_ERROR]", e);
      }
    }

    load();
    const id = setInterval(load, 15_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // =========================
  // 🟢 NEW — LOAD SYSTEM STATE (IPC)
  // =========================
  useEffect(() => {
    let alive = true;

    async function loadSystemState() {
      try {
        if (!window?.jupiter?.invoke) return;
        const res = await window.jupiter.invoke("system:getState");
        if (!alive) return;
        setSystemState(res);
      } catch (e) {
        console.error("[SYSTEM_STATE_LOAD_ERROR]", e);
      }
    }

    loadSystemState();
    const id = setInterval(loadSystemState, 15_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* =========================
     ENGINE POSITIONS (AUTHORITATIVE)
     ========================= */
  const positions = useMemo(
    () => (Array.isArray(valuation?.positions) ? valuation.positions : []),
    [valuation]
  );

  /* =========================
     ENGINE TOTALS (AUTHORITATIVE)
     ========================= */
  const totals = valuation?.totals || {
    snapshotValue: 0,
    liveValue: 0,
    delta: 0,
    deltaPct: 0,
  };

  const plClass =
    totals.delta > 0
      ? "pl-positive"
      : totals.delta < 0
      ? "pl-negative"
      : "pl-neutral";

  /* =========================
     SNAPSHOT + FRESHNESS
     ========================= */
  const snapshotTime =
    valuation?.priceSnapshotMeta?.fetchedAt || valuation?.snapshotAt || null;

  const engineFreshnessLevel =
    valuation?.priceSnapshotMeta?.freshness?.level || "UNKNOWN";
  const engineFreshnessConfidence =
    valuation?.priceSnapshotMeta?.freshness?.confidence || "UNKNOWN";

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
     TOP HOLDINGS (ENGINE DATA)
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
     ALLOCATION (DISPLAY ONLY)
     ========================= */
  const allocationBands = useMemo(() => {
    if (!positions.length || totals.liveValue <= 0) return [];

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
      percent: Math.round((val / totals.liveValue) * 100),
      color: BUCKET_COLORS[name],
    }));

    const sum = bands.reduce((a, b) => a + b.percent, 0);
    if (sum !== 100 && bands.length) bands[0].percent += 100 - sum;

    return bands;
  }, [positions, totals.liveValue]);

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

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
        <div className="value">{fmtMoney(totals.liveValue)}</div>
      </div>

      <div className={`card wide ${plClass}`}>
        <div className="label">TODAY’S P/L</div>
        <div className="value">
          {fmtMoney(totals.delta)} ({Number(totals.deltaPct).toFixed(2)}%)
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

      {/* =========================
          🟢 NEW — SYSTEM STATE CARD
         ========================= */}
      <div className="card wide">
        <div className="label">SYSTEM STATE</div>
        {!systemState ? (
          <div className="value">Loading…</div>
        ) : (
          <div className="value" style={{ lineHeight: 1.6 }}>
            <div>
              Posture: <strong>{systemState?.decision?.systemPosture}</strong>
            </div>
            <div>
              Capital: <strong>{systemState?.decision?.capitalState}</strong>
            </div>
            <div>
              Risk: <strong>{systemState?.risk?.regime}</strong>
            </div>
            <div>
              Signals:{" "}
              <strong>
                {systemState?.signals?.available ? "ACTIVE" : "QUIET"}
              </strong>
            </div>
            <div>
              Awareness:{" "}
              <strong>{systemState?.awareness?.systemState}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
