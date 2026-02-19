import { useEffect, useMemo, useState, useCallback } from "react";
import PortfolioActionsDrawer from "../components/PortfolioActionsDrawer.jsx";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & TOKENS
───────────────────────────────────────────────────────────── */
const C = {
  bg:           "#060910",
  surface:      "#0C1018",
  panel:        "#111827",
  panelHover:   "#141d2b",
  border:       "#1E293B",
  borderAccent: "#2d3f55",
  textPrimary:  "#F1F5F9",
  textSec:      "#94A3B8",
  textMuted:    "#4B5563",
  green:        "#22C55E",
  greenDim:     "rgba(34,197,94,0.12)",
  red:          "#EF4444",
  redDim:       "rgba(239,68,68,0.12)",
  blue:         "#3B82F6",
  blueDim:      "rgba(59,130,246,0.12)",
  gold:         "#F59E0B",
  goldDim:      "rgba(245,158,11,0.12)",
  purple:       "#8B5CF6",
  purpleDim:    "rgba(139,92,246,0.12)",
  cyan:         "#06B6D4",
};

const ASSET_CLASS_META = {
  equity: { label: "Equity",    color: "#3B82F6",   dimColor: "rgba(59,130,246,0.12)"   },
  crypto: { label: "Crypto",    color: "#8B5CF6",   dimColor: "rgba(139,92,246,0.12)"   },
  etf:    { label: "ETF",       color: "#06B6D4",   dimColor: "rgba(6,182,212,0.12)"    },
  cash:   { label: "Cash",      color: "#94A3B8",   dimColor: "rgba(148,163,184,0.1)"   },
};

const SORT_OPTIONS = [
  { key: "weight",   label: "Weight \u2193" },
  { key: "delta",    label: "P&L $"    },
  { key: "deltaPct", label: "P&L %"    },
  { key: "symbol",   label: "A \u2192 Z"    },
];

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */
function fmtMoney(n, compact = false) {
  const num = Number(n || 0);
  if (compact && Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}k`;
  }
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n) {
  const num = Number(n || 0);
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function deltaColor(n) {
  const num = Number(n);
  if (num > 0) return C.green;
  if (num < 0) return C.red;
  return C.textSec;
}

function deltaBg(n) {
  const num = Number(n);
  if (num > 0) return C.greenDim;
  if (num < 0) return C.redDim;
  return "transparent";
}

function freshnessDot(level) {
  const map = { LIVE: C.green, DELAYED: C.gold, STALE: C.red, UNKNOWN: C.textMuted };
  return map[level] || C.textMuted;
}

function assetMeta(p) {
  const cls = (p.assetClass || "equity").toLowerCase();
  return ASSET_CLASS_META[cls] || ASSET_CLASS_META.equity;
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

function WeightBar({ pct, color }) {
  return (
    <div style={{ width: "100%", height: 3, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`,
        height: "100%",
        background: color,
        borderRadius: 2,
        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: `0 0 6px ${color}80`,
      }} />
    </div>
  );
}

function MiniDeltaBar({ deltaPct }) {
  const pct = Math.min(Math.abs(Number(deltaPct)), 15) / 15 * 100;
  const isUp = Number(deltaPct) >= 0;
  return (
    <div style={{ width: "100%", height: 2, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: isUp ? C.green : C.red,
        borderRadius: 2,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div style={{
      padding: "6px 12px",
      borderRadius: 8,
      background: bg || "rgba(255,255,255,0.04)",
      border: `1px solid ${color || "#ffffff"}20`,
      display: "inline-flex",
      flexDirection: "column",
      gap: 2,
    }}>
      <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: color || C.textPrimary }}>{value}</span>
    </div>
  );
}

function SortButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px",
      borderRadius: 6,
      border: `1px solid ${active ? C.blue : C.border}`,
      background: active ? C.blueDim : "transparent",
      color: active ? C.blue : C.textSec,
      fontSize: 11,
      fontWeight: active ? 700 : 400,
      cursor: "pointer",
      transition: "all 0.15s ease",
      fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? color : C.border}`,
      background: active ? `${color}18` : "transparent",
      color: active ? color : C.textSec,
      fontSize: 11,
      fontWeight: active ? 700 : 400,
      cursor: "pointer",
      transition: "all 0.15s ease",
      fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   ALLOCATION BAR
───────────────────────────────────────────────────────────── */
function AllocationBar({ positions, totalLive }) {
  const bands = useMemo(() => {
    const buckets = {};
    for (const p of positions) {
      const cls = (p.assetClass || "equity").toLowerCase();
      buckets[cls] = (buckets[cls] || 0) + Number(p.liveValue || 0);
    }
    return Object.entries(buckets)
      .map(([cls, val]) => ({
        cls,
        pct: totalLive > 0 ? (val / totalLive) * 100 : 0,
        ...(ASSET_CLASS_META[cls] || ASSET_CLASS_META.equity),
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [positions, totalLive]);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", width: "100%", height: 8, borderRadius: 4, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {bands.map(b => (
          <div key={b.cls} style={{
            width: `${b.pct}%`,
            height: "100%",
            background: b.color,
            transition: "width 0.6s ease",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {bands.map(b => (
          <div key={b.cls} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
            <span style={{ fontSize: 11, color: C.textSec }}>{b.label} {b.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUMMARY BAND
───────────────────────────────────────────────────────────── */
function SummaryBand({ totals, positions, lastRefresh }) {
  const totalLive     = Number(totals.liveValue     || 0);
  const totalCost     = Number(totals.snapshotValue || 0);
  const totalDelta    = Number(totals.delta         || 0);
  const totalDeltaPct = Number(totals.deltaPct      || 0);
  const winners = positions.filter(p => Number(p.delta) > 0).length;
  const losers  = positions.filter(p => Number(p.delta) < 0).length;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "22px 28px",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Portfolio Value
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {fmtMoney(totalLive)}
          </div>
          <div style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: 8,
            background: deltaBg(totalDelta),
            border: `1px solid ${deltaColor(totalDelta)}30`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: deltaColor(totalDelta) }}>
              {fmtMoney(totalDelta)} &nbsp;{fmtPct(totalDeltaPct)}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted }}>vs cost basis</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <StatChip label="Book Cost"  value={fmtMoney(totalCost, true)} />
          <StatChip label="Positions"  value={positions.length} />
          <StatChip label="Winners"    value={winners} color={C.green} bg={C.greenDim} />
          <StatChip label="Losers"     value={losers}  color={C.red}   bg={C.redDim}   />
          {lastRefresh && <StatChip label="Refreshed" value={lastRefresh.toLocaleTimeString()} />}
        </div>
      </div>

      {positions.length > 0 && (
        <AllocationBar positions={positions} totalLive={totalLive} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DETAIL ITEM
───────────────────────────────────────────────────────────── */
function DetailItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || C.textPrimary }}>
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   POSITION CARD
───────────────────────────────────────────────────────────── */
function PositionCard({ p, totalLive, expanded, onToggle }) {
  const meta         = assetMeta(p);
  const weight       = totalLive > 0 ? (Number(p.liveValue) / totalLive) * 100 : 0;
  const costPerShare = Number(p.qty) > 0 ? Number(p.snapshotValue || 0) / Number(p.qty) : 0;
  const freshnessLvl = p.priceFreshness?.level || "UNKNOWN";
  const isUp         = Number(p.delta) >= 0;
  const accentLine   = isUp ? C.green : C.red;

  return (
    <div
      onClick={onToggle}
      style={{
        background: C.surface,
        border: `1px solid ${expanded ? C.borderAccent : C.border}`,
        borderLeft: `3px solid ${accentLine}`,
        borderRadius: 12,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "background 0.18s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.panelHover}
      onMouseLeave={e => e.currentTarget.style.background = C.surface}
    >
      {/* TOP ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>

        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.01em" }}>
              {p.symbol}
            </span>
            <span style={{
              padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700,
              background: meta.dimColor, color: meta.color,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {meta.label}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: freshnessDot(freshnessLvl),
                display: "inline-block",
                boxShadow: `0 0 4px ${freshnessDot(freshnessLvl)}`,
              }} />
              <span style={{ fontSize: 10, color: C.textMuted }}>{freshnessLvl}</span>
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: C.textSec }}>
              {Number(p.qty).toLocaleString(undefined, { maximumFractionDigits: 6 })} shares
            </span>
            <span style={{ fontSize: 13, color: C.textSec }}>
              @ <span style={{ color: C.textPrimary, fontWeight: 600 }}>{fmtMoney(p.livePrice)}</span>
            </span>
            {p.priceSource && (
              <span style={{ fontSize: 11, color: C.textMuted }}>{p.priceSource}</span>
            )}
          </div>

          <WeightBar pct={weight} color={meta.color} />
          <span style={{ fontSize: 10, color: C.textMuted, marginTop: 3, display: "block" }}>
            {weight.toFixed(1)}% of portfolio
          </span>
        </div>

        {/* Right: P&L */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary }}>
            {fmtMoney(p.liveValue)}
          </div>
          <div style={{
            marginTop: 4,
            display: "inline-flex", flexDirection: "column", alignItems: "flex-end",
            padding: "4px 10px", borderRadius: 7,
            background: deltaBg(p.delta),
            border: `1px solid ${deltaColor(p.delta)}25`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: deltaColor(p.delta) }}>
              {fmtMoney(p.delta)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: deltaColor(p.deltaPct) }}>
              {fmtPct(p.deltaPct)}
            </span>
          </div>
          <MiniDeltaBar deltaPct={p.deltaPct} />
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <div style={{
          marginTop: 16, paddingTop: 16,
          borderTop: `1px solid ${C.border}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          animation: "fadeIn 0.2s ease",
        }}>
          <DetailItem label="Book Cost"        value={fmtMoney(p.snapshotValue)} />
          <DetailItem label="Live Value"        value={fmtMoney(p.liveValue)} />
          <DetailItem label="Cost / Share"      value={fmtMoney(costPerShare)} />
          <DetailItem label="Live Price"        value={fmtMoney(p.livePrice)} />
          <DetailItem label="P&L $"             value={fmtMoney(p.delta)}      color={deltaColor(p.delta)} />
          <DetailItem label="P&L %"             value={fmtPct(p.deltaPct)}     color={deltaColor(p.deltaPct)} />
          <DetailItem label="Portfolio Weight"  value={`${weight.toFixed(2)}%`} />
          <DetailItem label="Freshness"         value={freshnessLvl}           color={freshnessDot(freshnessLvl)} />
          {p.currency && <DetailItem label="Currency"   value={p.currency} />}
          {p.priceFreshness?.asOf && (
            <DetailItem label="Price As Of" value={new Date(p.priceFreshness.asOf).toLocaleTimeString()} />
          )}
        </div>
      )}

      {/* Expand chevron */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        fontSize: 14, color: C.textMuted, opacity: 0.5,
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        pointerEvents: "none", lineHeight: 1,
      }}>&#9662;</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────── */
function Shimmer({ width, height, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: `linear-gradient(90deg, ${C.border} 25%, ${C.panel} 50%, ${C.border} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }} />
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.border}`, borderRadius: 12, padding: "16px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Shimmer width="120px" height="18px" />
          <Shimmer width="180px" height="13px" style={{ marginTop: 8 }} />
          <Shimmer width="100%"  height="3px"  style={{ marginTop: 10 }} />
        </div>
        <div>
          <Shimmer width="100px" height="18px" />
          <Shimmer width="70px"  height="32px" style={{ marginTop: 6 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.5; transform: scale(1.3); }
      }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; background: transparent; }
      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
    `}</style>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function Portfolio() {
  const [valuation,   setValuation]   = useState(null);
  const [error,       setError]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [sortKey,     setSortKey]     = useState("weight");
  const [filterClass, setFilterClass] = useState("ALL");
  const [expandedMap, setExpandedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Load ── */
  const loadValuation = useCallback(async () => {
    try {
      const v = await window.jupiter.invoke("portfolio:getValuation");
      setValuation(v);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("[PORTFOLIO_LOAD]", err);
      setError(err?.message || "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadValuation();
  }, [loadValuation]);

  /* ── Refresh ── */
  const refreshValuation = useCallback(async () => {
    try {
      setRefreshing(true);
      const v = await window.jupiter.refreshPortfolioValuation();
      setValuation(v);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  /* ── Derived ── */
  const rawPositions = useMemo(() => valuation?.positions || [], [valuation]);
  const totals       = useMemo(() => valuation?.totals    || {}, [valuation]);
  const totalLive    = Number(totals.liveValue || 0);

  const assetClasses = useMemo(() => {
    const classes = new Set(rawPositions.map(p => (p.assetClass || "equity").toLowerCase()));
    return ["ALL", ...Array.from(classes)];
  }, [rawPositions]);

  const positions = useMemo(() => {
    let list = [...rawPositions];

    if (filterClass !== "ALL") {
      list = list.filter(p => (p.assetClass || "equity").toLowerCase() === filterClass);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(p => p.symbol.toUpperCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sortKey) {
        case "weight":   return Number(b.liveValue) - Number(a.liveValue);
        case "delta":    return Number(b.delta)     - Number(a.delta);
        case "deltaPct": return Number(b.deltaPct)  - Number(a.deltaPct);
        case "symbol":   return a.symbol.localeCompare(b.symbol);
        default:         return 0;
      }
    });

    return list;
  }, [rawPositions, sortKey, filterClass, searchQuery]);

  const toggleExpanded = useCallback((symbol) => {
    setExpandedMap(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  }, []);

  const expandAll   = () => {
    const m = {};
    positions.forEach(p => { m[p.symbol] = true; });
    setExpandedMap(m);
  };
  const collapseAll = () => setExpandedMap({});

  /* ── Error state ── */
  if (error && !loading) {
    return (
      <div style={{ padding: 32, fontFamily: "'IBM Plex Mono', monospace", background: C.bg, minHeight: "100vh", color: C.textPrimary }}>
        <GlobalStyles />
        <div style={{
          padding: "20px 24px", borderRadius: 12,
          background: C.redDim, border: `1px solid ${C.red}40`,
          color: C.red, fontSize: 13,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>&#9888; {error}</span>
          <button onClick={loadValuation} style={{
            padding: "6px 14px", borderRadius: 7,
            border: `1px solid ${C.red}50`, background: "transparent",
            color: C.red, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
          }}>Retry</button>
        </div>
      </div>
    );
  }

  /* ── RENDER ── */
  return (
    <div style={{
      padding: "28px 32px",
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace, system-ui",
      background: C.bg,
      minHeight: "100vh",
      color: C.textPrimary,
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      <GlobalStyles />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Portfolio
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>
            Live valuations &middot; IPC-backed &middot; Engine-authoritative
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setActionsOpen(true)}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${C.blue}50`, background: C.blueDim,
              color: C.blue, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em",
            }}
          >
            + Manage Holdings
          </button>

          <button
            onClick={refreshValuation}
            disabled={refreshing}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: "transparent",
              color: refreshing ? C.textMuted : C.textSec,
              fontSize: 12, fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: refreshing ? C.gold : C.green,
              boxShadow: `0 0 5px ${refreshing ? C.gold : C.green}`,
              animation: refreshing ? "pulse 1s infinite" : "none",
            }} />
            {refreshing ? "Refreshing\u2026" : "Refresh"}
          </button>
        </div>
      </div>

      {/* SUMMARY BAND */}
      {loading ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 28px", marginBottom: 20 }}>
          <Shimmer width="280px" height="38px" />
          <Shimmer width="180px" height="28px" style={{ marginTop: 10 }} />
          <Shimmer width="100%"  height="8px"  style={{ marginTop: 20 }} />
        </div>
      ) : (
        <SummaryBand totals={totals} positions={rawPositions} lastRefresh={lastRefresh} />
      )}

      {/* CONTROLS */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, marginBottom: 16, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            placeholder="Search symbol\u2026"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: "5px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.textPrimary, fontSize: 12, outline: "none",
              fontFamily: "inherit", width: 140,
            }}
          />
          {assetClasses.map(cls => {
            const meta = cls === "ALL"
              ? { color: C.textSec }
              : (ASSET_CLASS_META[cls] || ASSET_CLASS_META.equity);
            return (
              <FilterPill key={cls} active={filterClass === cls} onClick={() => setFilterClass(cls)} color={meta.color}>
                {cls === "ALL" ? "All" : (ASSET_CLASS_META[cls]?.label || cls)}
              </FilterPill>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.06em" }}>SORT</span>
          {SORT_OPTIONS.map(s => (
            <SortButton key={s.key} active={sortKey === s.key} onClick={() => setSortKey(s.key)}>
              {s.label}
            </SortButton>
          ))}
          <button onClick={expandAll}   style={{ fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 6px" }}>expand all</button>
          <button onClick={collapseAll} style={{ fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 6px" }}>collapse</button>
        </div>
      </div>

      {/* POSITION LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : positions.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, color: C.textMuted, fontSize: 13,
          }}>
            {searchQuery || filterClass !== "ALL"
              ? "No positions match your filter."
              : "No positions loaded. Add holdings via \"Manage Holdings\"."}
          </div>
        ) : (
          positions.map(p => (
            <PositionCard
              key={p.symbol}
              p={p}
              totalLive={totalLive}
              expanded={!!expandedMap[p.symbol]}
              onToggle={() => toggleExpanded(p.symbol)}
            />
          ))
        )}
      </div>

      {/* FOOTER */}
      {!loading && positions.length > 0 && (
        <div style={{
          marginTop: 20, padding: "12px 16px",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>
            {positions.length} position{positions.length !== 1 ? "s" : ""} displayed
            {filterClass !== "ALL" && ` \u00b7 filtered by ${filterClass}`}
            {searchQuery && ` \u00b7 searching "${searchQuery}"`}
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>
            Last updated: {lastRefresh ? lastRefresh.toLocaleString() : "\u2014"}
          </span>
        </div>
      )}

      {/* DRAWER */}
      <PortfolioActionsDrawer
        open={actionsOpen}
        onClose={() => {
          setActionsOpen(false);
          loadValuation();
        }}
      />
    </div>
  );
}
