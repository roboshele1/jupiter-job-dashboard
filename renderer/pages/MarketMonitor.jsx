/**
 * MarketMonitor.jsx — JUPITER (Session 7 upgrade)
 * --------------------------------------------------
 * Adds: macro regime context via marketRegime:get IPC
 * Retains: live price polling every 10s, sector metadata, freshness badges
 *
 * IPC channels:
 *   portfolio:getValuation   — live positions + prices (existing)
 *   marketRegime:get         — regime: RISK_ON | RISK_OFF | TRANSITION (existing, now wired)
 */

import { useEffect, useMemo, useState } from "react";

const C = {
  bg:        "#060910",
  surface:   "#0c1220",
  panel:     "#0f172a",
  border:    "#1a2540",
  text:      "#e2e8f0",
  textSec:   "#94a3b8",
  textMuted: "#6b7280",
  textDim:   "#374151",
  green:     "#22c55e",
  greenDim:  "rgba(34,197,94,0.10)",
  red:       "#ef4444",
  redDim:    "rgba(239,68,68,0.10)",
  gold:      "#f59e0b",
  goldDim:   "rgba(245,158,11,0.10)",
  blue:      "#3b82f6",
  blueDim:   "rgba(59,130,246,0.10)",
  cyan:      "#06b6d4",
  font:      "'IBM Plex Mono', monospace",
};

const ASSET_META = {
  NVDA: { sector: "Semiconductors", color: "#76b900" },
  AVGO: { sector: "Semiconductors", color: "#cc0000" },
  ASML: { sector: "Semiconductors", color: "#0071c5" },
  MSTR: { sector: "Bitcoin Proxy",  color: "#f7931a" },
  HOOD: { sector: "Fintech",        color: "#00c805" },
  BMNR: { sector: "BTC Mining",     color: "#f7931a" },
  APLD: { sector: "BTC Mining",     color: "#6366f1" },
  NOW:  { sector: "Software",       color: "#81b5ff" },
  BTC:  { sector: "Crypto",         color: "#f7931a" },
  ETH:  { sector: "Crypto",         color: "#627eea" },
};

const REGIME_META = {
  RISK_ON:    { color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   label: "RISK ON",     icon: "\u25b2", implication: "Growth & crypto favoured. Full position deployment justified." },
  RISK_OFF:   { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   label: "RISK OFF",    icon: "\u25bc", implication: "Defensive posture. Trim speculative exposure. Hold cash." },
  TRANSITION: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  label: "TRANSITION",  icon: "\u25c6", implication: "Mixed signals. Maintain current positions. Avoid new entries." },
};

const mono = { fontFamily: C.font };

function fmt(n, d = 2) {
  if (n === null || n === undefined || isNaN(n)) return "\u2014";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtMoney(n) { return `$${fmt(n, 2)}`; }
function fmtPct(n) {
  if (n === null || n === undefined || isNaN(n)) return "\u2014";
  const sign = Number(n) >= 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(2)}%`;
}
function deltaColor(n) {
  const x = Number(n);
  if (x > 0) return C.green;
  if (x < 0) return C.red;
  return C.textSec;
}
function freshnessBadge(level) {
  const map = {
    LIVE:    { bg: "rgba(34,197,94,0.12)",   color: C.green,   dot: C.green   },
    DELAYED: { bg: "rgba(245,158,11,0.12)",  color: C.gold,    dot: C.gold    },
    STALE:   { bg: "rgba(239,68,68,0.12)",   color: C.red,     dot: C.red     },
    UNKNOWN: { bg: "rgba(148,163,184,0.08)", color: C.textSec, dot: C.textSec },
  };
  return map[level] || map.UNKNOWN;
}

function RegimeBanner({ regime, confidence, signals, timestamp }) {
  if (!regime) return null;
  const meta = REGIME_META[regime] || REGIME_META.TRANSITION;
  const confPct = typeof confidence === "number" ? Math.round(confidence * 100) : null;
  const signalItems = signals ? [
    { label: "Volatility", value: signals.volatility },
    { label: "Breadth",    value: signals.breadth    },
    { label: "Trend",      value: signals.trend      },
  ] : [];

  return (
    <div style={{
      background:   meta.bg,
      border:       `1px solid ${meta.border}`,
      borderLeft:   `3px solid ${meta.color}`,
      borderRadius: 10,
      padding:      "18px 22px",
      marginBottom: 20,
      ...mono,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20, color: meta.color }}>{meta.icon}</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: meta.color, letterSpacing: "0.08em" }}>
              {meta.label}
            </span>
            {confPct !== null && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 4,
                background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
                color: meta.color,
              }}>
                {confPct}% confidence
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6, maxWidth: 480 }}>
            {meta.implication}
          </div>
        </div>
        {signalItems.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {signalItems.map(s => (
              <div key={s.label} style={{
                background: C.panel, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "8px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: "0.1em", marginBottom: 3 }}>{s.label.toUpperCase()}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.value || "\u2014"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {timestamp && (
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 10 }}>
          Regime computed: {new Date(timestamp).toLocaleTimeString()}
          {" \u00b7 "}
          <span style={{ color: C.textMuted }}>Inputs: VIX level, breadth %&gt;50DMA, index trend</span>
        </div>
      )}
    </div>
  );
}

function PositionCard({ p, totalLive }) {
  const meta   = ASSET_META[p.symbol] || { sector: "Other", color: C.textSec };
  const fresh  = freshnessBadge(p.priceFreshness?.level);
  const isUp   = Number(p.delta) >= 0;
  const weight = totalLive > 0 ? (Number(p.liveValue) / totalLive) * 100 : 0;

  return (
    <div style={{
      background:   C.surface,
      border:       `1px solid ${isUp ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"}`,
      borderLeft:   `3px solid ${isUp ? C.green : C.red}`,
      borderRadius: 10,
      padding:      "18px 22px",
      ...mono,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 19, fontWeight: 800, color: C.text }}>{p.symbol}</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: C.textSec }}>
            {meta.sector}
          </span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: fresh.bg, color: fresh.color, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: fresh.dot, display: "inline-block" }} />
            {p.priceFreshness?.level || "UNKNOWN"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>WEIGHT</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{weight.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ width: "100%", height: 3, background: C.border, borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(weight, 100)}%`, height: "100%", background: meta.color, borderRadius: 2 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {[
          { label: "LIVE PRICE", value: fmtMoney(p.livePrice),                        color: C.text    },
          { label: "QTY",        value: Number(p.qty).toLocaleString(undefined, { maximumFractionDigits: 6 }), color: C.textSec },
          { label: "LIVE VALUE", value: fmtMoney(p.liveValue),                         color: C.text    },
          { label: "BOOK COST",  value: fmtMoney(p.snapshotValue || p.totalCostBasis), color: C.textSec },
          { label: "TODAY P/L",  value: fmtMoney(p.delta), sub: fmtPct(p.deltaPct),   color: deltaColor(p.delta), subColor: deltaColor(p.deltaPct) },
        ].map(stat => (
          <div key={stat.label}>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            {stat.sub && <div style={{ fontSize: 11, fontWeight: 600, color: stat.subColor, marginTop: 1 }}>{stat.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ width: "100%", height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(Math.abs(Number(p.deltaPct)), 20) / 20 * 100}%`,
            height: "100%", background: isUp ? C.green : C.red,
            borderRadius: 2, transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>P/L bar scaled to \u00b120%</div>
      </div>
    </div>
  );
}

export default function MarketMonitor() {
  const [valuation,  setValuation]  = useState(null);
  const [regime,     setRegime]     = useState(null);
  const [snapshotAt, setSnapshotAt] = useState(null);
  const [tickCount,  setTickCount]  = useState(0);
  const [error,      setError]      = useState(null);
  const [ticking,    setTicking]    = useState(false);
  const [sortBy,     setSortBy]     = useState("value");

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      setTicking(true);
      setTickCount(c => c + 1);
      try {
        const v = await window.jupiter.invoke("portfolio:getValuation");
        if (!alive) return;
        setValuation(v);
        setSnapshotAt(new Date());
        setError(null);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Price fetch failed");
      } finally {
        if (alive) setTicking(false);
      }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Regime — load once, non-blocking
  useEffect(() => {
    let alive = true;
    window.jupiter.invoke("marketRegime:get")
      .then(r => { if (alive && r) setRegime(r); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const positions  = useMemo(() => {
    const raw = Array.isArray(valuation?.positions) ? valuation.positions : [];
    return [...raw].sort((a, b) => {
      if (sortBy === "deltaPct") return Number(b.deltaPct) - Number(a.deltaPct);
      if (sortBy === "delta")    return Number(b.delta)    - Number(a.delta);
      return Number(b.liveValue) - Number(a.liveValue);
    });
  }, [valuation, sortBy]);

  const totals     = valuation?.totals || {};
  const totalLive  = Number(totals.liveValue || 0);
  const bestToday  = useMemo(() => positions.reduce((b, p) => !b  || Number(p.deltaPct) > Number(b.deltaPct)  ? p : b,  null), [positions]);
  const worstToday = useMemo(() => positions.reduce((w, p) => !w  || Number(p.deltaPct) < Number(w.deltaPct)  ? p : w,  null), [positions]);

  const regimeData = regime?.regime;

  return (
    <div style={{ ...mono, background: C.bg, minHeight: "100vh", padding: "28px 32px", color: C.text, maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Market Monitor</h1>
          <p style={{ color: C.textMuted, marginTop: 4, fontSize: 11 }}>
            Live prices \u00b7 Auto-refreshing every 10s \u00b7 Macro regime context
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: ticking ? C.gold : C.green,
            boxShadow:  ticking ? `0 0 8px ${C.gold}` : `0 0 8px ${C.green}`,
            transition: "all 0.3s",
          }} />
          <span style={{ color: C.textMuted, fontSize: 11 }}>
            {snapshotAt ? snapshotAt.toLocaleTimeString() : "\u2014"} \u00b7 Tick #{tickCount}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: "10px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: C.red, fontSize: 12 }}>
          \u26a0 {error}
        </div>
      )}

      {/* Regime banner — independent of price data, shows as soon as regime resolves */}
      <RegimeBanner
        regime={regimeData?.regime}
        confidence={regimeData?.confidence}
        signals={regimeData?.signals}
        timestamp={regime?.timestamp}
      />

      {!valuation && !error && (
        <div style={{ color: C.textMuted, padding: 40, textAlign: "center", fontSize: 12 }}>
          Loading live market data\u2026
        </div>
      )}

      {valuation && (
        <>
          {/* Summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "TOTAL LIVE VALUE", value: fmtMoney(totalLive),                                                            color: C.text  },
              { label: "TODAY'S P/L",      value: `${fmtMoney(totals.delta)} (${fmtPct(totals.deltaPct)})`,                       color: deltaColor(totals.delta) },
              { label: "BEST TODAY",       value: bestToday  ? `${bestToday.symbol}  ${fmtPct(bestToday.deltaPct)}`   : "\u2014", color: C.green },
              { label: "WORST TODAY",      value: worstToday ? `${worstToday.symbol}  ${fmtPct(worstToday.deltaPct)}` : "\u2014", color: C.red   },
            ].map(card => (
              <div key={card.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.1em", marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center" }}>
            <span style={{ color: C.textMuted, fontSize: 11 }}>Sort by:</span>
            {[
              { key: "value",    label: "Portfolio Value" },
              { key: "deltaPct", label: "% Change"        },
              { key: "delta",    label: "$ Change"        },
            ].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                ...mono, padding: "5px 14px", borderRadius: 6, border: "1px solid", fontSize: 11, cursor: "pointer",
                borderColor: sortBy === s.key ? C.blue    : C.border,
                background:  sortBy === s.key ? "rgba(59,130,246,0.10)" : "transparent",
                color:       sortBy === s.key ? C.blue    : C.textSec,
              }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Position cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {positions.map(p => <PositionCard key={p.symbol} p={p} totalLive={totalLive} />)}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, padding: "12px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>{positions.length} positions \u00b7 auto-refreshes every 10s</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>Last update: {snapshotAt ? snapshotAt.toLocaleString() : "\u2014"}</span>
          </div>
        </>
      )}
    </div>
  );
}
