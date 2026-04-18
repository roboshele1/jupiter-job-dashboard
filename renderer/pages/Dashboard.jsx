import { C } from "../styles/colorScheme.js";
import { useEffect, useMemo, useState } from "react";
import { useAlerts } from "../context/AlertContext";
import AssetSystemStatePanel from "../components/AssetSystemStatePanel.jsx";

function fmt(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtMoney(n) { return `$${fmt(n, 2)}`; }
function fmtPct(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  const sign = Number(n) >= 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(2)}%`;
}
function deltaColor(n) {
  const x = Number(n);
  if (x > 0) return "#4ade80";
  if (x < 0) return "#f87171";
  return "#9ca3af";
}

const ASSET_CLASS_CONFIG = {
  crypto: { label: "Crypto", color: "#fbbf24" },
  etf: { label: "ETF", color: "#8b5cf6" },
  equity: { label: "Equity", color: "#4cc9f0" },
};

const FRESHNESS_RANK = { LIVE: 3, DELAYED: 2, STALE: 1, UNKNOWN: 0 };

function pickBestFreshness(positions) {
  let best = { level: "UNKNOWN" }, bestRank = 0;
  for (const p of positions || []) {
    const level = p?.priceFreshness?.level || "UNKNOWN";
    const rank  = FRESHNESS_RANK[level] ?? 0;
    if (rank > bestRank) { bestRank = rank; best = { level }; }
  }
  return best;
}

export default function Dashboard() {
  const { addAlert } = useAlerts();

  useEffect(() => {
    (async () => {
      try {
        const holdingsRes = await window.jupiter.invoke('holdings:getRaw');
        if (holdingsRes?.ok) {
          const result = await window.jupiter.invoke('daemon:runMonitoring', {
            holdings: holdingsRes.data || []
          });
          if (result?.ok && result.data?.length > 0) {
            result.data.forEach(alert => addAlert(alert));
          }
        }
      } catch (err) {
        console.error('Monitoring error:', err);
      }
    })();
  }, [addAlert]);

  const [valuation,   setValuation]   = useState(null);
  const [systemState, setSystemState] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  async function loadAll(force = false) {
    setRefreshing(true);
    try {
      const [v, sys] = await Promise.allSettled([
        force ? window.jupiter.invoke('portfolio:refreshValuation') : window.jupiter.getPortfolioValuation(),
        window.jupiter.invoke("system:getState"),
      ]);
      if (v.status     === "fulfilled") setValuation(v.value);
      if (sys.status   === "fulfilled") setSystemState(sys.value);
      setLastRefresh(new Date());
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
    const id = setInterval(() => loadAll(), 60_000 + Math.random() * 5000) // rate-limited: 60s + jitter;
    return () => clearInterval(id);
  }, []);

  const positions  = useMemo(() => Array.isArray(valuation?.positions) ? valuation.positions : [], [valuation]);
  const totals     = valuation?.totals || { liveValue: 0, delta: 0, deltaPct: 0 };

  const topHoldings = useMemo(() =>
    [...positions].sort((a, b) => Number(b.liveValue) - Number(a.liveValue)).slice(0, 5),
    [positions]);

  const bestToday  = useMemo(() => positions.reduce((best,  p) => !best  || Number(p.deltaPct) > Number(best.deltaPct)  ? p : best,  null), [positions]);
  const worstToday = useMemo(() => positions.reduce((worst, p) => !worst || Number(p.deltaPct) < Number(worst.deltaPct) ? p : worst, null), [positions]);

  const allocationBands = useMemo(() => {
    if (!positions.length || !totals.liveValue) return [];
    const buckets = {};
    for (const p of positions) {
      const assetClass = p.assetClass || "equity";
      const config = ASSET_CLASS_CONFIG[assetClass] || ASSET_CLASS_CONFIG.equity;
      const key = config.label;
      buckets[key] = (buckets[key] || 0) + Number(p.liveValue || 0);
    }
    const bands = Object.entries(buckets).map(([name, val]) => {
      const config = Object.values(ASSET_CLASS_CONFIG).find(c => c.label === name) || ASSET_CLASS_CONFIG.equity;
      return {
        name, 
        pct: Math.round((val / totals.liveValue) * 100), 
        color: config.color
      };
    });
    const sum = bands.reduce((s, b) => s + b.pct, 0);
    if (sum !== 100 && bands.length) bands[0].pct += 100 - sum;
    return bands.filter(b => b.pct > 0);
  }, [positions, totals.liveValue]);

  const portfolioValue = Number(totals.liveValue || 0);
  const GOAL_TARGET = 1_000_000;
  const GOAL_START = 100_000;
  const GOAL_YEAR = 2037;
  const now = new Date();
  const monthsRemaining = Math.max(0, (GOAL_YEAR - now.getFullYear()) * 12 - now.getMonth());
  const goalProgressPct = Math.min((portfolioValue / GOAL_TARGET) * 100, 100);
  const goalRemaining = Math.max(GOAL_TARGET - portfolioValue, 0);
  const yearsRemaining = monthsRemaining / 12;
  const requiredCAGR = yearsRemaining > 0 ? (Math.pow(GOAL_TARGET / Math.max(portfolioValue, 1), 1 / yearsRemaining) - 1) * 100 : null;
  const freshness      = useMemo(() => pickBestFreshness(positions), [positions]);
  const marketStatus   = freshness.level;
  const freshnessColor = marketStatus === "LIVE" ? "#4ade80" : marketStatus === "DELAYED" ? "#fbbf24" : marketStatus === "STALE" ? "#f87171" : "#9ca3af";


  const posture      = systemState?.decision?.systemPosture || "—";
  const capitalState = systemState?.decision?.capitalState   || "—";
  const riskRegime   = systemState?.risk?.regime             || "—";
  const postureColor = posture === "AGGRESSIVE" ? "#f87171" : posture === "CAUTIOUS" ? "#fbbf24" : posture === "NEUTRAL" ? "#4ade80" : "#9ca3af";

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ color: "#9ca3af", marginTop: 4, fontSize: 13 }}>Last refreshed: {lastRefresh ? lastRefresh.toLocaleString() : "—"}</p>
        </div>
        <button onClick={() => loadAll(true)} disabled={refreshing} style={{
          padding: "9px 20px", borderRadius: 8, border: "none",
          background: refreshing ? "#1f2937" : "#3b82f6", color: refreshing ? "#6b7280" : "#fff",
          fontWeight: 600, fontSize: 13, cursor: refreshing ? "not-allowed" : "pointer"
        }}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Row 1: Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "PORTFOLIO VALUE", value: fmtMoney(portfolioValue), sub: null, color: "#fff", border: "#374151" },
          { label: "TODAY'S P/L", value: fmtMoney(totals.delta), sub: fmtPct(totals.deltaPct), color: deltaColor(totals.delta), border: Number(totals.delta) >= 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)" },
          { label: "BEST TODAY",  value: bestToday  ? bestToday.symbol  : "—", sub: bestToday  ? fmtPct(bestToday.deltaPct)  : null, color: "#4ade80", border: "rgba(74,222,128,0.2)"  },
          { label: "WORST TODAY", value: worstToday ? worstToday.symbol : "—", sub: worstToday ? fmtPct(worstToday.deltaPct) : null, color: "#f87171", border: "rgba(248,113,113,0.2)" },
        ].map(card => (
          <div key={card.label} style={{ background: "rgba(31,41,55,0.6)", border: `1px solid ${card.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
            {card.sub && <div style={{ fontSize: 13, fontWeight: 600, color: card.color, marginTop: 2 }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Goal: $100k → $1M by 2037</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>
              {fmtMoney(goalRemaining)} remaining · {monthsRemaining} months · Required CAGR: {requiredCAGR ? requiredCAGR.toFixed(1) + "%" : "—"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{goalProgressPct.toFixed(1)}%</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>of goal</div>
          </div>
        </div>
        <div style={{ width: "100%", height: 12, background: "#1f2937", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: `${goalProgressPct}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: 6, transition: "width 0.8s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          {["$100k","$250k","$500k","$750k","$1M"].map((m, i) => (
            <span key={m} style={{ color: portfolioValue >= [100000,250000,500000,750000,1000000][i] ? "#60a5fa" : "#4b5563", fontWeight: portfolioValue >= [100000,250000,500000,750000,1000000][i] ? 700 : 400 }}>{m}</span>
          ))}
        </div>
      </div>

      {/* Row 3: Intelligence Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 8 }}>SYSTEM POSTURE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: postureColor }}>{posture}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Capital: {capitalState}</div>
        </div>
        <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 8 }}>MARKET DATA</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: freshnessColor, boxShadow: `0 0 6px ${freshnessColor}` }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: freshnessColor }}>{marketStatus}</div>
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Risk: {riskRegime}</div>
        </div>
      </div>

      {/* Row 4: Allocation + Top Holdings */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>PORTFOLIO ALLOCATION</div>
          <div style={{ width: "100%", height: 44, borderRadius: 12, overflow: "hidden", display: "flex", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
            {allocationBands.map(b => (
              <div key={b.name} style={{ width: `${b.pct}%`, height: "100%", background: b.color, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 12, fontWeight: 700, color: "rgba(8,10,18,0.85)", whiteSpace: "nowrap", overflow: "hidden" }}>
                {b.pct >= 10 ? `${b.name} ${b.pct}%` : ""}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {allocationBands.map(b => (
              <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{b.name} {b.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 14 }}>TOP HOLDINGS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topHoldings.map(h => {
              const pct = totals.liveValue > 0 ? (Number(h.liveValue) / Number(totals.liveValue)) * 100 : 0;
              return (
                <div key={h.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{h.symbol}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{fmtMoney(h.liveValue)}</div>
                    <div style={{ fontSize: 11, color: deltaColor(h.deltaPct) }}>{fmtPct(h.deltaPct)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 6: System State */}
      <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>SYSTEM STATE</div>
        {!systemState ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading system intelligence…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 16 }}>
              {[
                { label: "POSTURE", value: systemState?.decision?.systemPosture, color: postureColor },
                { label: "CAPITAL", value: systemState?.decision?.capitalState,  color: "#e5e7eb"    },
                { label: "RISK",    value: systemState?.risk?.regime,            color: "#e5e7eb"    },
                { label: "SIGNALS", value: systemState?.signals?.available ? "ACTIVE" : "QUIET", color: systemState?.signals?.available ? "#4ade80" : "#9ca3af" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6, letterSpacing: "0.08em" }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value || "—"}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
