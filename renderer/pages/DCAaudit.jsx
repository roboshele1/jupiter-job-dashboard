/**
 * renderer/pages/DCAaudit.jsx
 * JUPITER — DCA Execution Audit Tab with Live Polygon Prices
 * 
 * Log every DCA allocation decision and track actual vs expected drift
 * Entry prices fetched live from Polygon API
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  logBatchDCAExecutionWithPrices,
  updateExecutionPricesLive,
  getExecutions,
  groupExecutionsByDate,
  calculateAuditStats,
  deleteExecution,
} from "../../engine/audit/dcaAuditEngine.js";

const C = {
  bg:        "#060910",
  surface:   "#0c1220",
  panel:     "#0f172a",
  border:    "#1a2540",
  borderAcc: "#2d3f55",
  text:      "#e2e8f0",
  textSec:   "#94a3b8",
  textMuted: "#6b7280",
  textDim:   "#374151",
  green:     "#22c55e",
  red:       "#ef4444",
  blue:      "#3b82f6",
  gold:      "#f59e0b",
  cyan:      "#06b6d4",
};

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// DCA config loaded dynamically from dca:config:get
const DEFAULT_BUCKETS = {
  bucketA: [
    { symbol: "PLTR", pct: 0.40, active: true },
    { symbol: "RKLB", pct: 0.35, active: true },
    { symbol: "APP",  pct: 0.25, active: true },
  ],
  bucketB: [
    { symbol: "AXON", pct: 0.40, active: true },
    { symbol: "NU",   pct: 0.30, active: true },
    { symbol: "MELI", pct: 0.30, active: true },
  ],
  bucketASplit: 0.40,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtPct(n, decimals = 1) {
  if (n === null || n === undefined) return "—";
  const sign = Number(n) >= 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(decimals)}%`;
}

function driftColor(status) {
  if (status === "BEATING") return C.green;
  if (status === "ON_TRACK") return C.blue;
  if (status === "LAGGING") return C.red;
  return C.textMuted;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: C.textMuted, textTransform: "uppercase" }}>
        {children}
      </div>
      {sub && <div style={{ ...mono, fontSize: 9, color: C.textDim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: color || C.text, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>{sub}</div>}
    </div>
  );
}

// ── Log Execution Dialog ──────────────────────────────────────────────────────
function LogExecutionDialog({ onClose, onSubmit, buckets }) {
  const [dcaAmount, setDcaAmount] = useState(500);
  const [allocations, setAllocations] = useState([]);
  const [isLogging, setIsLogging] = useState(false);

  const calculateAllocations = (amount) => {
    const allocs = [];
    
    const cfg = buckets || DEFAULT_BUCKETS;
    const split = cfg.bucketASplit ?? 0.40;
    const bucketATotal = amount * split;
    const bucketBTotal = amount * (1 - split);
    const activeA = (cfg.bucketA || []).filter(s => s.active !== false);
    const activeB = (cfg.bucketB || []).filter(s => s.active !== false);
    const sumA = activeA.reduce((s, x) => s + x.pct, 0) || 1;
    const sumB = activeB.reduce((s, x) => s + x.pct, 0) || 1;
    activeA.forEach(s => allocs.push({ symbol: s.symbol, amount: bucketATotal * (s.pct / sumA), bucket: "A" }));
    activeB.forEach(s => allocs.push({ symbol: s.symbol, amount: bucketBTotal * (s.pct / sumB), bucket: "B" }));
    
    
    return allocs;
  };

  useEffect(() => {
    setAllocations(calculateAllocations(dcaAmount));
  }, [dcaAmount]);

  const handleSubmit = async () => {
    setIsLogging(true);
    try {
      await logBatchDCAExecutionWithPrices(allocations);
      onSubmit();
      onClose();
    } catch (err) {
      console.error('Failed to log execution:', err);
      alert('Failed to log execution. Check console for details.');
      setIsLogging(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "24px 28px",
        maxWidth: 600,
        maxHeight: "80vh",
        overflow: "auto",
      }}>
        <div style={{ ...mono, fontSize: 14, fontWeight: 700, marginBottom: 20, color: C.text }}>
          Log DCA Execution
        </div>

        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Total DCA Amount</SectionLabel>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={dcaAmount}
            onChange={(e) => setDcaAmount(Number(e.target.value))}
            style={{ width: "100%", height: 8, borderRadius: 4, background: C.border, outline: "none", cursor: "pointer" }}
            disabled={isLogging}
          />
          <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.blue, marginTop: 12 }}>
            {fmtMoney(dcaAmount)}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Allocations (by bucket)</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["A", "B", "C"].map(bucket => {
              const bucketAllocs = allocations.filter(a => a.bucket === bucket);
              const total = bucketAllocs.reduce((s, a) => s + a.amount, 0);
              return (
                <div key={bucket} style={{
                  background: C.panel,
                  border: `1px solid ${C.borderAcc}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                }}>
                  <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>
                    BUCKET {bucket}
                  </div>
                  {bucketAllocs.map(a => (
                    <div key={a.symbol} style={{ ...mono, fontSize: 11, color: C.text, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                      <span>{a.symbol}</span>
                      <span style={{ color: C.blue }}>{fmtMoney(a.amount)}</span>
                    </div>
                  ))}
                  <div style={{ ...mono, fontSize: 10, color: C.gold, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.borderAcc}` }}>
                    Total: {fmtMoney(total)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={isLogging}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: isLogging ? C.textMuted : C.blue,
              color: C.text,
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: isLogging ? "not-allowed" : "pointer",
              ...mono,
              opacity: isLogging ? 0.5 : 1,
            }}
          >
            {isLogging ? "Fetching prices..." : "Log Execution"}
          </button>
          <button
            onClick={onClose}
            disabled={isLogging}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: C.panel,
              color: C.text,
              border: `1px solid ${C.borderAcc}`,
              borderRadius: 8,
              fontWeight: 700,
              cursor: isLogging ? "not-allowed" : "pointer",
              ...mono,
              opacity: isLogging ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


// ── ML: CAGR Forecast Panel ────────────────────────────────────────────────
// Reads ledger snapshots via ml:cagrForecast, fits log-linear regression,
// projects 1/3/5yr with ±1.5σ confidence bands. Pure Node math, no deps.
function MLForecastPanel() {
  const [forecast, setForecast] = React.useState(null);
  const [loading, setLoading]   = React.useState(true);

  React.useEffect(() => {
    window.jupiter.invoke('ml:cagrForecast')
      .then(res => { if (res?.ok) setForecast(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const GOAL = 1_000_000;
  const REQUIRED_CAGR = 26.7;

  if (loading) return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24, ...mono, fontSize: 11, color: C.textMuted }}>
      Running CAGR regression…
    </div>
  );

  if (!forecast || !forecast.projections?.length) return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24, ...mono, fontSize: 11, color: C.textMuted }}>
      Insufficient ledger data for forecast — portfolio value snapshots accumulate daily. Check back tomorrow.
    </div>
  );

  const cagrColor = forecast.cagr >= REQUIRED_CAGR ? C.green : forecast.cagr >= REQUIRED_CAGR - 5 ? C.gold : C.red;
  const fiveYr = forecast.projections.find(p => p.years === 5);
  const threeYr = forecast.projections.find(p => p.years === 3);
  const oneYr = forecast.projections.find(p => p.years === 1);

  // Mini SVG timeline bar
  const maxVal = fiveYr ? fiveYr.high : GOAL;
  const barW = 420;
  const barH = 56;
  const toX = v => Math.min((v / maxVal) * barW, barW);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
      {/* Header */}
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: C.textMuted, textTransform: "uppercase", marginBottom: 16 }}>
        ML CAGR Trajectory Forecast
        <span style={{ marginLeft: 12, fontWeight: 400, color: "#374151" }}>
          log-linear regression · {forecast.dataPoints} snapshots · R² {forecast.rSquared}
        </span>
      </div>

      {/* Top metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.borderAcc}`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Fitted CAGR</div>
          <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: cagrColor }}>{forecast.cagr}%</div>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 4 }}>target {REQUIRED_CAGR}%</div>
        </div>
        {[oneYr, threeYr, fiveYr].map(p => p && (
          <div key={p.years} style={{ background: C.panel, border: `1px solid ${C.borderAcc}`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 6, textTransform: "uppercase" }}>{p.years}yr Projection</div>
            <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: p.mid >= GOAL ? C.green : C.text }}>
              {fmtMoney(p.mid)}
            </div>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 4 }}>
              {fmtMoney(p.low)} – {fmtMoney(p.high)}
            </div>
          </div>
        ))}
      </div>

      {/* SVG confidence band timeline */}
      <div style={{ marginBottom: 16 }}>
        <svg width="100%" viewBox={`0 0 ${barW + 60} ${barH + 24}`} style={{ overflow: "visible" }}>
          {/* Goal line */}
          <line x1={toX(GOAL)} y1={0} x2={toX(GOAL)} y2={barH} stroke={C.green} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
          <text x={toX(GOAL) + 4} y={10} fill={C.green} fontSize={8} opacity={0.7} fontFamily="IBM Plex Mono">$1M</text>

          {/* Current value dot */}
          <circle cx={0} cy={barH / 2} r={5} fill={C.blue} />
          <text x={6} y={barH / 2 + 4} fill={C.textMuted} fontSize={8} fontFamily="IBM Plex Mono">Now</text>

          {/* Projection bands per year */}
          {forecast.projections.map((p, i) => {
            const cx = toX(p.mid);
            const lx = toX(p.low);
            const hx = toX(p.high);
            const cy = barH / 2;
            const bandColor = p.mid >= GOAL ? C.green : C.blue;
            return (
              <g key={p.years}>
                {/* Band */}
                <rect x={lx} y={cy - 8} width={Math.max(hx - lx, 2)} height={16}
                  fill={bandColor} opacity={0.12} rx={3} />
                {/* Low tick */}
                <line x1={lx} y1={cy - 10} x2={lx} y2={cy + 10} stroke={bandColor} strokeWidth={1} opacity={0.4} />
                {/* High tick */}
                <line x1={hx} y1={cy - 10} x2={hx} y2={cy + 10} stroke={bandColor} strokeWidth={1} opacity={0.4} />
                {/* Mid dot */}
                <circle cx={cx} cy={cy} r={4} fill={bandColor} />
                {/* Label */}
                <text x={cx} y={barH + 16} fill={C.textMuted} fontSize={8} textAnchor="middle" fontFamily="IBM Plex Mono">{p.years}yr</text>
              </g>
            );
          })}

          {/* Trend line from 0 to 5yr mid */}
          {fiveYr && (
            <line x1={0} y1={barH / 2} x2={toX(fiveYr.mid)} y2={barH / 2}
              stroke={cagrColor} strokeWidth={1.5} strokeDasharray="6 3" opacity={0.35} />
          )}
        </svg>
      </div>

      {/* Status message */}
      <div style={{ background: C.panel, border: `1px solid ${C.borderAcc}`, borderRadius: 8, padding: "10px 14px", ...mono, fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>
        {forecast.cagr >= REQUIRED_CAGR ? (
          <span><span style={{ color: C.green, fontWeight: 700 }}>On trajectory</span> — fitted CAGR of {forecast.cagr}% clears the {REQUIRED_CAGR}% target. 5yr mid projection: {fmtMoney(fiveYr?.mid)}.</span>
        ) : (
          <span><span style={{ color: C.red, fontWeight: 700 }}>Below target</span> — fitted CAGR {forecast.cagr}% vs required {REQUIRED_CAGR}%. Gap: {(REQUIRED_CAGR - forecast.cagr).toFixed(1)}pp. Increase allocation to highest-CAGR positions to close.</span>
        )}
        <span style={{ marginLeft: 8, color: "#374151" }}>Confidence bands ±1.5σ.</span>
      </div>
    </div>
  );
}

function CAGRPerformancePanel({ executions, currentPortfolioValue }) {
  const [portfolioBlendedCAGR, setPortfolioBlendedCAGR] = useState(null);
  const [totalMarketValue, setTotalMarketValue] = useState(0);
  const [topCAGRAssets, setTopCAGRAssets] = useState([]);

  // Load portfolio blended CAGR from live market values via IPC
  useEffect(() => {
    const loadBlendedCAGR = async () => {
      try {
        const data = await window.jupiter.invoke("portfolio:get-market-values", {});
        if (!data) return;

        setPortfolioBlendedCAGR(data.blendedCAGR);
        setTotalMarketValue(data.totalMarketValue);
        
        // Get top 3 highest CAGR assets
        if (data.holdings && data.holdings.length > 0) {
          const sorted = [...data.holdings]
            .sort((a, b) => b.expectedCagr - a.expectedCagr)
            .slice(0, 3)
            .map(h => `${h.symbol} ${h.expectedCagr.toFixed(0)}%`);
          setTopCAGRAssets(sorted);
        }
      } catch (err) {
        console.error("[DCA AUDIT] Failed to load blended CAGR from market values:", err);
      }
    };

    loadBlendedCAGR();
  }, []);

  // Calculate execution-based blended CAGR (only new DCA allocations)
  const calculateExecutionBlendedCAGR = () => {
    if (!executions || executions.length === 0) return null;

    // Group by symbol, calculate weighted average
    const symbolCAGR = {};
    const symbolWeights = {};

    executions.forEach(exec => {
      if (!symbolCAGR[exec.symbol]) {
        symbolCAGR[exec.symbol] = exec.cagr;
        symbolWeights[exec.symbol] = exec.amount;
      } else {
        symbolWeights[exec.symbol] += exec.amount;
      }
    });

    const totalAmount = Object.values(symbolWeights).reduce((s, w) => s + w, 0);
    const blended = Object.entries(symbolCAGR).reduce((sum, [symbol, cagr]) => {
      return sum + (cagr * (symbolWeights[symbol] / totalAmount));
    }, 0);

    return blended;
  };

  // Calculate overall blended CAGR (current holdings at market value + DCA allocations combined)
  const calculateOverallBlendedCAGR = () => {
    if (!portfolioBlendedCAGR) return null;

    const executionBlended = calculateExecutionBlendedCAGR();
    if (!executionBlended) return portfolioBlendedCAGR; // No executions yet

    // Current portfolio market value and DCA allocation value
    const dcaValue = (executions || []).reduce((s, e) => s + e.amount, 0);
    const totalValue = totalMarketValue + dcaValue;

    // Weighted blended
    const portfolioWeight = totalMarketValue / totalValue;
    const dcaWeight = dcaValue / totalValue;

    const overall = (portfolioBlendedCAGR * portfolioWeight) + (executionBlended * dcaWeight);
    return overall;
  };

  const REQUIRED_CAGR = 26.7;
  const GOAL_TARGET = 1_000_000;
  const GOAL_YEAR = 2037;
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS_TO_GOAL = GOAL_YEAR - CURRENT_YEAR;

  const executionBlendedCAGR = calculateExecutionBlendedCAGR();
  const overallBlendedCAGR = calculateOverallBlendedCAGR();

  // Project 2037 value using live market value (not cost basis)
  const projectedValue2037 = overallBlendedCAGR
    ? (totalMarketValue || currentPortfolioValue) * Math.pow(1 + overallBlendedCAGR / 100, YEARS_TO_GOAL)
    : (totalMarketValue || currentPortfolioValue);

  const shortfall = GOAL_TARGET - projectedValue2037;
  const statusColor = overallBlendedCAGR >= REQUIRED_CAGR ? C.green : (overallBlendedCAGR >= REQUIRED_CAGR - 0.5 ? C.gold : C.red);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "20px 24px",
      marginBottom: 32,
    }}>
      <SectionLabel>CAGR Performance vs Target</SectionLabel>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}>
        <div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
            Portfolio Baseline CAGR
          </div>
          <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: C.blue }}>
            {portfolioBlendedCAGR ? portfolioBlendedCAGR.toFixed(1) : "—"}%
          </div>
        </div>

        {executions && executions.length > 0 && (
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
              Execution Blended CAGR
            </div>
            <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: statusColor }}>
              {executionBlendedCAGR ? executionBlendedCAGR.toFixed(1) : "—"}%
            </div>
          </div>
        )}

        <div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
            Overall Blended CAGR
          </div>
          <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: statusColor }}>
            {overallBlendedCAGR ? overallBlendedCAGR.toFixed(1) : portfolioBlendedCAGR ? portfolioBlendedCAGR.toFixed(1) : "—"}%
          </div>
        </div>

        <div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
            Required CAGR
          </div>
          <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: C.blue }}>
            {REQUIRED_CAGR.toFixed(1)}%
          </div>
        </div>

        <div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
            2037 Projection
          </div>
          <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: projectedValue2037 >= GOAL_TARGET ? C.green : C.gold }}>
            {fmtMoney(projectedValue2037)}
          </div>
        </div>
      </div>

      {/* Shortfall/Surplus message */}
      <div style={{
        background: C.panel,
        border: `1px solid ${C.borderAcc}`,
        borderRadius: 8,
        padding: "12px 16px",
        ...mono,
        fontSize: 11,
        color: C.textMuted,
        lineHeight: "1.6",
      }}>
        {shortfall > 0 ? (
          <span>
            <span style={{ color: C.red, fontWeight: 700 }}>Shortfall: {fmtMoney(shortfall)}</span>
            {" "}— To reach $1M by 2037, blended CAGR needs to be {REQUIRED_CAGR.toFixed(1)}% or higher. DCA Audit allocations targeting highest-CAGR assets ({topCAGRAssets.length > 0 ? topCAGRAssets.join(", ") : "loading..."}) can lift overall CAGR above {REQUIRED_CAGR.toFixed(1)}%.
          </span>
        ) : (
          <span>
            <span style={{ color: C.green, fontWeight: 700 }}>On Track: {fmtMoney(Math.abs(shortfall))}</span>
            {" "}— Overall blended CAGR of {overallBlendedCAGR?.toFixed(1)}% projects to {fmtMoney(projectedValue2037)} by 2037, exceeding $1M target.
          </span>
        )}
      </div>
    </div>
  );
}

function ExecutionLedger({ executions }) {
  const [expanded, setExpanded] = useState({});

  if (!executions || executions.length === 0) {
    return (
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "24px",
        textAlign: "center",
        color: C.textMuted,
        ...mono,
        fontSize: 12,
      }}>
        No executions logged yet. Click "Log DCA Execution" above.
      </div>
    );
  }

  const grouped = executions.reduce((acc, exec) => {
    const date = formatDate(exec.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(exec);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const toggle = (date) => setExpanded(prev => ({ ...prev, [date]: !prev[date] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sortedDates.map(date => {
        const rows = grouped[date];
        const totalDeployed = rows.reduce((s, r) => s + (r.amount || 0), 0);
        const avgReturn = rows.filter(r => r.actualReturnPct !== null).length > 0
          ? rows.filter(r => r.actualReturnPct !== null).reduce((s, r) => s + r.actualReturnPct, 0) / rows.filter(r => r.actualReturnPct !== null).length
          : null;
        const isOpen = expanded[date];

        return (
          <div key={date} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div
              onClick={() => toggle(date)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", userSelect: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = C.borderAcc}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ ...mono, fontSize: 10, color: isOpen ? C.blue : C.textMuted, letterSpacing: "0.1em" }}>{isOpen ? "▼" : "▶"}</span>
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.text }}>{date}</span>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{rows.length} execution{rows.length > 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 2 }}>DEPLOYED</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.blue }}>{fmtMoney(totalDeployed)}</div>
                </div>
                {avgReturn !== null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 2 }}>AVG RETURN</div>
                    <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: avgReturn >= 0 ? C.green : C.red }}>{fmtPct(avgReturn, 2)}</div>
                  </div>
                )}
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: `1px solid ${C.border}`, overflow: "auto" }}>
                <table style={{ width: "100%", ...mono, fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase" }}>
                      <th style={{ textAlign: "left", padding: "10px 20px", fontWeight: 600 }}>Symbol</th>
                      <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600 }}>Amount</th>
                      <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600 }}>Entry Price</th>
                      <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600 }}>Current</th>
                      <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600 }}>Return</th>
                      <th style={{ textAlign: "center", padding: "10px 20px", fontWeight: 600 }}>Drift Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(exec => (
                      <tr key={exec.id} style={{ borderBottom: `1px solid ${C.borderAcc}`, color: C.text }}>
                        <td style={{ padding: "10px 20px", fontWeight: 700 }}>{exec.symbol}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right", color: C.blue }}>{fmtMoney(exec.amount)}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>{exec.entryPrice ? "$" + exec.entryPrice.toFixed(2) : "—"}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>{exec.currentPrice ? "$" + exec.currentPrice.toFixed(2) : "—"}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right", color: exec.actualReturnPct !== null ? (exec.actualReturnPct >= 0 ? C.green : C.red) : C.textMuted }}>
                          {exec.actualReturnPct !== null ? fmtPct(exec.actualReturnPct, 2) : "—"}
                        </td>
                        <td style={{ padding: "10px 20px", textAlign: "center" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 4, background: driftColor(exec.driftStatus) + "20", color: driftColor(exec.driftStatus), fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>
                            {exec.driftStatus || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function PerformanceAuditPanel({ executions }) {
  if (!executions || executions.length === 0) {
    return (
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "24px",
        marginBottom: 32,
        textAlign: "center",
        color: C.textMuted,
        ...mono,
        fontSize: 12,
      }}>
        <div style={{ ...mono, fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.text }}>
          Performance Audit
        </div>
        No executions logged yet. Once you log DCA allocations, actual vs expected performance will appear here.
      </div>
    );
  }

  const symbolMetrics = {};
  executions.forEach(exec => {
    if (!symbolMetrics[exec.symbol]) {
      symbolMetrics[exec.symbol] = {
        symbol: exec.symbol,
        executions: [],
        totalAmount: 0,
      };
    }
    symbolMetrics[exec.symbol].executions.push(exec);
    symbolMetrics[exec.symbol].totalAmount += exec.amount;
  });

  const metrics = Object.values(symbolMetrics).map(sym => {
    const execs = sym.executions;
    const avgConviction = execs.reduce((s, e) => s + (e.convictionAtExecution || 0.5), 0) / execs.length;
    const avgActualReturn = execs.reduce((s, e) => s + (e.actualReturnPct || 0), 0) / execs.length;
    const avgMonthsHeld = execs.reduce((s, e) => {
      const months = (Date.now() - e.timestamp) / (1000 * 60 * 60 * 24 * 30);
      return s + months;
    }, 0) / execs.length;
    const expectedReturnFromCAGR = execs.length > 0 
      ? (Math.pow(1 + (execs[0].cagr || 20) / 100, avgMonthsHeld / 12) - 1) * 100
      : 0;

    return {
      symbol: sym.symbol,
      convictionAtExecution: Number(avgConviction.toFixed(2)),
      actualReturnPct: Number(avgActualReturn.toFixed(2)),
      expectedReturnFromCAGR: Number(expectedReturnFromCAGR.toFixed(2)),
      convictionAccuracy: avgActualReturn >= expectedReturnFromCAGR * 0.9 ? "ACCURATE" : "OPTIMISTIC",
      totalAllocated: sym.totalAmount,
      executionCount: execs.length,
    };
  });

  metrics.sort((a, b) => b.convictionAtExecution - a.convictionAtExecution);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "20px 24px",
      marginBottom: 32,
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          Performance Audit
        </div>
        <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>
          Expected CAGR vs Actual Return • Conviction Accuracy
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {metrics.map(m => (
          <div key={m.symbol} style={{
            background: C.panel,
            border: `1px solid ${C.borderAcc}`,
            borderRadius: 8,
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "80px 1fr 1fr 1fr 1fr",
            gap: 16,
            alignItems: "center",
          }}>
            <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.text }}>
              {m.symbol}
            </div>
            <div>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>CONVICTION</div>
              <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.blue }}>
                {(m.convictionAtExecution * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>EXPECTED</div>
              <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.gold }}>
                {m.expectedReturnFromCAGR.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>ACTUAL</div>
              <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: m.actualReturnPct >= 0 ? C.green : C.red }}>
                {m.actualReturnPct.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>STATUS</div>
              <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: m.convictionAccuracy === "ACCURATE" ? C.green : C.gold }}>
                {m.convictionAccuracy}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DCAaudit() {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [livePortfolioValue, setLivePortfolioValue] = useState(0);
  useEffect(() => { window.jupiter.invoke('portfolio:getValuation').then(v => { if (v?.totals?.liveValue) setLivePortfolioValue(v.totals.liveValue); }).catch(() => {}); }, []);
  const [dcaConfig, setDcaConfig] = useState(DEFAULT_BUCKETS);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [allHoldings, setAllHoldings] = useState([]);

  // Load executions and DCA config on mount
  useEffect(() => {
    const loaded = getExecutions();
    setExecutions(loaded);
    const computed = calculateAuditStats();
    setStats(computed);
    window.jupiter.invoke("dca:config:get").then(cfg => {
      if (cfg) setDcaConfig(cfg);
    }).catch(() => {});
    window.jupiter.invoke("holdings:getRaw").then(hdgs => {
      if (Array.isArray(hdgs)) setAllHoldings(hdgs.map(h => h.symbol).filter(Boolean));
    }).catch(() => {});
  }, []);

  const handleLogExecution = async () => {
    const loaded = getExecutions();
    setExecutions(loaded);
    const computed = calculateAuditStats();
    setStats(computed);
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const marketData = await window.jupiter.invoke("dca-audit:update-prices-live");
      const raw = localStorage.getItem("jupiter:dca:executions");
      const loaded = raw ? JSON.parse(raw) : [];
      const updated = loaded.map(exec => {
        const price = marketData[exec.symbol];
        if (price == null) return exec;
        const actualReturnPct = exec.entryPrice ? ((price - exec.entryPrice) / exec.entryPrice) * 100 : null;
        const daysHeld = (Date.now() - exec.timestamp) / (1000 * 60 * 60 * 24);
        const monthsHeld = daysHeld / 30;
        const expectedReturn = (Math.pow(1 + exec.expectedMonthlyDrift / 100, monthsHeld) - 1) * 100;
        const driftStatus = monthsHeld < 0.5 ? "TOO_EARLY" : actualReturnPct >= expectedReturn * 0.95 ? "BEATING" : actualReturnPct >= expectedReturn * 0.80 ? "ON_TRACK" : "LAGGING";
        return { ...exec, currentPrice: price, actualReturnPct, driftStatus, lastUpdated: Date.now() };
      });
      localStorage.setItem("jupiter:dca:executions", JSON.stringify(updated));
      setExecutions(updated);
      const computed = calculateAuditStats();
      setStats(computed);
    } catch (err) {
      console.error('Failed to refresh prices:', err);
      alert('Failed to refresh prices. Check console for details.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{
      background: C.bg,
      minHeight: "100vh",
      padding: "24px 32px",
      fontFamily: "'IBM Plex Mono', monospace",
      color: C.text,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ ...mono, fontSize: 16, fontWeight: 700 }}>
            ◈ DCA Execution Audit
          </div>
          <button
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            style={{
              padding: "8px 14px",
              background: C.blue,
              color: C.text,
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              ...mono,
              fontSize: 11,
              opacity: isRefreshing ? 0.5 : 1,
            }}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
        </div>
        <div style={{ ...mono, fontSize: 11, color: C.textMuted }}>
          Track every DCA allocation and measure actual vs expected drift (live prices from Polygon)
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        <StatBox
          label="Total Executions"
          value={stats?.totalExecutions || 0}
          color={C.blue}
        />
        <StatBox
          label="Total Invested"
          value={fmtMoney(stats?.totalInvested || 0)}
          color={C.text}
        />
        <StatBox
          label="Current Value"
          value={fmtMoney(stats?.currentValue || 0)}
          color={stats?.aggregateReturnPct >= 0 ? C.green : C.red}
        />
        <StatBox
          label="Aggregate Return"
          value={fmtPct(stats?.aggregateReturnPct || 0, 2)}
          color={stats?.aggregateReturnPct >= 0 ? C.green : C.red}
        />
      </div>

      {/* ML CAGR Forecast Panel */}
      <MLForecastPanel />

      {/* CAGR Performance Panel */}
      <CAGRPerformancePanel executions={executions} currentPortfolioValue={livePortfolioValue || stats?.currentValue || 0} />

      {/* Drift Summary */}
      {stats && (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: 32,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}>
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
              Beating Drift
            </div>
            <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.green }}>
              {stats.driftBeatingCount}
            </div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.blue, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
              On Track
            </div>
            <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.blue }}>
              {stats.driftOnTrackCount}
            </div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.red, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
              Lagging
            </div>
            <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.red }}>
              {stats.driftLaggingCount}
            </div>
          </div>
        </div>
      )}

      {/* Performance Audit Panel */}
      <PerformanceAuditPanel executions={executions} />

      {/* Log Execution Button */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => setShowLogDialog(true)}
          style={{
            padding: "12px 20px",
            background: C.blue,
            color: C.text,
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            ...mono,
            fontSize: 12,
          }}
        >
          + Log DCA Execution
        </button>
        <button
          onClick={() => setShowConfigPanel(p => !p)}
          style={{
            padding: "10px 20px",
            background: showConfigPanel ? C.blue : "transparent",
            color: showConfigPanel ? "#000" : C.blue,
            border: `1px solid ${C.blue}`,
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            ...mono,
            fontSize: 12,
          }}
        >
          ⚙ DCA SETTINGS
        </button>
      </div>

      {/* DCA Config Panel */}
      {showConfigPanel && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: C.textMuted, marginBottom: 16 }}>DCA ALLOCATION SETTINGS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {["bucketA", "bucketB"].map(bucket => {
              const bucketItems = dcaConfig[bucket] || [];
              const otherBucket = bucket === "bucketA" ? "bucketB" : "bucketA";
              const otherSymbols = (dcaConfig[otherBucket] || []).filter(s => s.active).map(s => s.symbol);
              const existingSymbols = bucketItems.map(s => s.symbol);
              const safeHoldings = Array.isArray(allHoldings) ? allHoldings : [];
              const EXCLUDE = new Set(["BTC", "ETH", "ZMMK.TO"]);
              const mergedItems = [
                ...bucketItems,
                ...safeHoldings.filter(sym => !existingSymbols.includes(sym) && !EXCLUDE.has(sym) && !otherSymbols.includes(sym)).map(sym => ({ symbol: sym, pct: 0.10, active: false }))
              ];
              return (
                <div key={bucket}>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 10 }}>{bucket === "bucketA" ? "BUCKET A (40% of DCA)" : "BUCKET B (60% of DCA)"}</div>
                  {mergedItems.map((item, idx) => (
                    <div key={item.symbol} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "10px 14px", background: item.active ? "#0a1a0a" : C.bgCard, border: `1px solid ${item.active ? C.green+"40" : C.border}`, borderRadius: 6 }}>
                      <input type="checkbox" checked={item.active} onChange={e => {
                        const updated = { ...dcaConfig };
                        const exists = updated[bucket].find(s => s.symbol === item.symbol);
                        if (exists) {
                          updated[bucket] = updated[bucket].map(s => s.symbol === item.symbol ? { ...s, active: e.target.checked } : s);
                        } else {
                          updated[bucket] = [...updated[bucket], { ...item, active: e.target.checked }];
                        }
                        setDcaConfig(updated);
                        window.jupiter.invoke("dca:config:save", updated).catch(() => {});
                      }} style={{ cursor: "pointer", accentColor: C.green }} />
                      <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: item.active ? C.text : C.textMuted, flex: 1 }}>{item.symbol}</span>
                      {!item.active && <span style={{ ...mono, fontSize: 9, color: C.textMuted }}>inactive</span>}
                      {item.active && <input type="number" min="0" max="1" step="0.05" value={item.pct} onChange={e => {
                        const updated = { ...dcaConfig };
                        updated[bucket] = updated[bucket].map(s => s.symbol === item.symbol ? { ...s, pct: Number(e.target.value) } : s);
                        setDcaConfig(updated);
                        window.jupiter.invoke("dca:config:save", updated).catch(() => {});
                      }} style={{ ...mono, fontSize: 11, width: 60, padding: "4px 8px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, textAlign: "right" }} />}
                      {item.active && <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>weight</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution Ledger */}
      <div style={{ marginBottom: 32 }}>
        <SectionLabel>Execution History (with live prices)</SectionLabel>
        <ExecutionLedger executions={executions} />
      </div>

      {/* Dialog */}
      {showLogDialog && (
        <LogExecutionDialog
          onClose={() => setShowLogDialog(false)}
          onSubmit={handleLogExecution}
          buckets={dcaConfig}
        />
      )}

      {/* Footer note */}
      <div style={{
        background: C.panel,
        border: `1px solid ${C.borderAcc}`,
        borderRadius: 10,
        padding: "14px 16px",
        ...mono,
        fontSize: 9,
        color: C.textMuted,
        lineHeight: "1.6",
      }}>
        Entry prices fetched live from Polygon API at execution time. Current prices auto-update when you click "Refresh Prices" or on each new execution log. Drift Status: BEATING = beating expected monthly drift by >5% | ON_TRACK = within 5-20% of expected | LAGGING = underperforming by >20% | TOO_EARLY = less than 2 weeks held. NO_ENTRY_PRICE = live price fetch failed at execution time.
      </div>
    </div>
  );
}
