/**
 * renderer/pages/DCAaudit.jsx
 * JUPITER — DCA Execution Audit Tab with Live Polygon Prices
 * 
 * Log every DCA allocation decision and track actual vs expected drift
 * Entry prices fetched live from Polygon API
 */

import { useEffect, useState, useMemo } from "react";
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

// Priority Funding Schedule (mirrored from your scheduler)
const PRIORITY_BUCKETS = {
  BUCKET_A: [
    { symbol: "PLTR", pct: 0.40 },
    { symbol: "RKLB", pct: 0.35 },
    { symbol: "APP", pct: 0.25 },
  ],
  BUCKET_B: [
    { symbol: "AXON", pct: 0.40 },
    { symbol: "NU", pct: 0.30 },
    { symbol: "MELI", pct: 0.30 },
  ],
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
    
    // Bucket A: 40% of DCA (PLTR 40%, RKLB 35%, APP 25%)
    const bucketATotal = amount * 0.40;
    allocs.push({ symbol: "PLTR", amount: bucketATotal * 0.40, bucket: "A" });
    allocs.push({ symbol: "RKLB", amount: bucketATotal * 0.35, bucket: "A" });
    allocs.push({ symbol: "APP", amount: bucketATotal * 0.25, bucket: "A" });
    
    // Bucket B: 40% of DCA (AXON 40%, NU 30%, MELI 30%)
    const bucketBTotal = amount * 0.60;
    allocs.push({ symbol: "AXON", amount: bucketBTotal * 0.40, bucket: "B" });
    allocs.push({ symbol: "NU", amount: bucketBTotal * 0.30, bucket: "B" });
    allocs.push({ symbol: "MELI", amount: bucketBTotal * 0.30, bucket: "B" });
    
    
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
    ? (totalMarketValue || 74232) * Math.pow(1 + overallBlendedCAGR / 100, YEARS_TO_GOAL)
    : (totalMarketValue || 74232);

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

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "16px 0",
      overflow: "auto",
    }}>
      <table style={{ width: "100%", ...mono, fontSize: 11 }}>
        <thead>
          <tr style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase" }}>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Date</th>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Symbol</th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Amount</th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Entry Price</th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Current</th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Return</th>
            <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 600 }}>Drift Status</th>
          </tr>
        </thead>
        <tbody>
          {executions.map(exec => (
            <tr key={exec.id} style={{ borderBottom: `1px solid ${C.borderAcc}`, color: C.text }}>
              <td style={{ padding: "10px 16px" }}>{formatDate(exec.timestamp)}</td>
              <td style={{ padding: "10px 16px", fontWeight: 700 }}>{exec.symbol}</td>
              <td style={{ padding: "10px 16px", textAlign: "right", color: C.blue }}>{fmtMoney(exec.amount)}</td>
              <td style={{ padding: "10px 16px", textAlign: "right" }}>
                {exec.entryPrice ? "$" + exec.entryPrice.toFixed(2) : "—"}
              </td>
              <td style={{ padding: "10px 16px", textAlign: "right" }}>
                {exec.currentPrice ? "$" + exec.currentPrice.toFixed(2) : "—"}
              </td>
              <td style={{ 
                padding: "10px 16px", 
                textAlign: "right", 
                color: exec.actualReturnPct !== null ? (exec.actualReturnPct >= 0 ? C.green : C.red) : C.textMuted 
              }}>
                {exec.actualReturnPct !== null ? fmtPct(exec.actualReturnPct, 2) : "—"}
              </td>
              <td style={{ padding: "10px 16px", textAlign: "center" }}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: driftColor(exec.driftStatus) + "20",
                  color: driftColor(exec.driftStatus),
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: "uppercase",
                }}>
                  {exec.driftStatus || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

  // Load executions on mount
  useEffect(() => {
    const loaded = getExecutions();
    setExecutions(loaded);
    const computed = calculateAuditStats();
    setStats(computed);
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

      {/* CAGR Performance Panel */}
      <CAGRPerformancePanel executions={executions} currentPortfolioValue={stats?.currentValue || 74232} />

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
      </div>

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
          buckets={PRIORITY_BUCKETS}
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
