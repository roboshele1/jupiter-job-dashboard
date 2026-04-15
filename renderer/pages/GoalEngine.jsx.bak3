// renderer/pages/GoalEngine.jsx
// GOAL ENGINE TAB — replaces System State
// Answers: "Is this portfolio on track to hit $1M by 2037?"
//
// IPC channels used (all pre-existing, no new handlers needed):
//   decisions:getKellyRecommendations  -> goal metrics, required CAGR, all positions
//   portfolio:getValuation             -> live position values for per-asset projection
//
// Design rules: IBM Plex Mono, #060910 bg, inline styles only, C token colours

import { useEffect, useState, useMemo, useCallback } from "react";

// ── Colour tokens ────────────────────────────────────────────────────────────
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
  greenDim:  "rgba(34,197,94,0.10)",
  red:       "#ef4444",
  redDim:    "rgba(239,68,68,0.10)",
  blue:      "#3b82f6",
  blueDim:   "rgba(59,130,246,0.10)",
  gold:      "#f59e0b",
  goldDim:   "rgba(245,158,11,0.10)",
  cyan:      "#06b6d4",
  purple:    "#a855f7",
};

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const GOAL_TARGET = 1_000_000;
const GOAL_YEAR   = 2037;

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n, decimals = 1) {
  if (n === null || n === undefined) return "\u2014";
  const sign = Number(n) >= 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(decimals)}%`;
}
function fmtCAGR(n) {
  if (n === null || n === undefined) return "\u2014";
  return `${Number(n).toFixed(1)}% / yr`;
}
function deltaColor(n) {
  if (Number(n) > 0) return C.green;
  if (Number(n) < 0) return C.red;
  return C.textMuted;
}

// Project a position value forward at a given CAGR
function projectValue(currentValue, cagrPct, years) {
  if (!currentValue || !years) return currentValue || 0;
  const r = (cagrPct || 0) / 100;
  return currentValue * Math.pow(1 + r, years);
}

// Calculate compound growth with monthly DCA contributions
function projectWithDCA(startValue, monthlyContribution, monthlyRate, totalMonths) {
  let val = startValue;
  for (let i = 0; i < totalMonths; i++) {
    val = val * (1 + monthlyRate) + monthlyContribution;
  }
  return val;
}

// Conviction CAGR assumptions (mirrors Kelly convictions)
const CAGR_ASSUMPTIONS = {
  PLTR: 45, APP: 40, RKLB: 38, AVGO: 30, NU: 28, NVDA: 28,
  AXON: 25, MELI: 25, LLY: 23, NOW: 22, ZETA: 21, BTC: 20,
  ASML: 15, ETH: 15, MSTR: 18,
  // Legacy/exited positions
  HOOD: 15, BMNR: 12, APLD: 10,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: C.textMuted, textTransform: "uppercase" }}>
        {children}
      </div>
      {sub && <div style={{ ...mono, fontSize: 9, color: C.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, color, bg, border }) {
  return (
    <div style={{
      background: bg || C.surface, border: `1px solid ${border || C.border}`,
      borderRadius: 10, padding: "18px 20px",
    }}>
      <div style={{ ...mono, fontSize: 10, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: color || C.text }}>{value}</div>
      {sub && <div style={{ ...mono, fontSize: 11, color: C.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Compounding curve ─────────────────────────────────────────────────────────
function CompoundingCurve({ portfolioValue, requiredCAGR, goalTarget, dcaAmount }) {
  const years = GOAL_YEAR - new Date().getFullYear();
  const steps = years * 4; // quarterly points

  const curve = useMemo(() => {
    if (!portfolioValue || !requiredCAGR) return [];
    const pts = [];
    const reqMonthly  = Math.pow(1 + requiredCAGR / 100, 1 / 12) - 1;
    // Conservative estimate: 60% of required CAGR
    const consMonthly = Math.pow(1 + (requiredCAGR * 0.6) / 100, 1 / 12) - 1;
    const totalMonths = years * 12;
    const interval    = Math.ceil(totalMonths / steps);

    // WITH DCA curve
    let withDCA = portfolioValue;
    // WITHOUT DCA curve
    let req  = portfolioValue;
    let cons = portfolioValue;

    for (let m = 0; m <= totalMonths; m += interval) {
      pts.push({ month: m, withDCA, required: req, conservative: cons });
      for (let i = 0; i < interval; i++) {
        withDCA = withDCA * (1 + reqMonthly) + (dcaAmount || 0);
        req  = req  * (1 + reqMonthly);
        cons = cons * (1 + consMonthly);
      }
    }
    return pts;
  }, [portfolioValue, requiredCAGR, years, steps, dcaAmount]);

  if (!curve.length) return null;

  const W = 660, H = 200, PAD = { l: 60, r: 20, t: 16, b: 32 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...curve.map(p => Math.max(p.withDCA, p.required)), goalTarget);
  const totalMonths = years * 12;

  function xPos(m)  { return PAD.l + (m / totalMonths) * innerW; }
  function yPos(v)  { return PAD.t + innerH - (v / maxVal) * innerH; }

  const withDCAPath = curve.map((p, i) => `${i === 0 ? "M" : "L"}${xPos(p.month).toFixed(1)},${yPos(p.withDCA).toFixed(1)}`).join(" ");
  const reqPath  = curve.map((p, i) => `${i === 0 ? "M" : "L"}${xPos(p.month).toFixed(1)},${yPos(p.required).toFixed(1)}`).join(" ");
  const consPath = curve.map((p, i) => `${i === 0 ? "M" : "L"}${xPos(p.month).toFixed(1)},${yPos(p.conservative).toFixed(1)}`).join(" ");
  const goalY    = yPos(goalTarget);

  // Year markers
  const yearMarkers = Array.from({ length: years + 1 }, (_, i) => i).map(yr => ({
    label: String(new Date().getFullYear() + yr),
    x: xPos(yr * 12),
  }));

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
      <SectionLabel sub="Required CAGR trajectory with/without DCA vs conservative (60%) scenario">Compounding Curve to 2037</SectionLabel>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Goal line */}
        <line x1={PAD.l} y1={goalY} x2={W - PAD.r} y2={goalY}
          stroke={C.green} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
        <text x={W - PAD.r + 4} y={goalY + 4} style={{ ...mono, fontSize: 9, fill: C.green, fontFamily: "'IBM Plex Mono', monospace" }}>$1M</text>

        {/* Conservative path */}
        <path d={consPath} fill="none" stroke={C.blue} strokeWidth="1.5" opacity="0.5" strokeDasharray="3,2" />

        {/* Required path (organic only) */}
        <path d={reqPath} fill="none" stroke={C.gold} strokeWidth="2" />

        {/* With DCA path */}
        {dcaAmount > 0 && (
          <path d={withDCAPath} fill="none" stroke={C.purple} strokeWidth="2.5" opacity="0.9" />
        )}

        {/* Current value dot */}
        <circle cx={xPos(0)} cy={yPos(portfolioValue)} r="4" fill={C.gold} />

        {/* Year labels */}
        {yearMarkers.map(m => (
          <text key={m.label} x={m.x} y={H - 4}
            textAnchor="middle"
            style={{ ...mono, fontSize: 8, fill: C.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
            {m.label}
          </text>
        ))}

        {/* Y axis: current + goal */}
        <text x={PAD.l - 4} y={yPos(portfolioValue) + 4}
          textAnchor="end"
          style={{ ...mono, fontSize: 8, fill: C.textSec, fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmtMoney(portfolioValue)}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
        {dcaAmount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 2, background: C.purple }} />
            <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>With DCA ({fmtMoney(dcaAmount)}/mo)</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 2, background: C.gold }} />
          <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>Required ({fmtCAGR(requiredCAGR)})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 2, background: C.blue, opacity: 0.6 }} />
          <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>Conservative ({fmtCAGR(requiredCAGR * 0.6)})</span>
        </div>
      </div>
    </div>
  );
}

// ── DCA Sensitivity Slider ────────────────────────────────────────────────────
function DcaSensitivitySlider({ portfolioValue, requiredCAGR, yearsRemaining, dcaAmount, onDCAChange }) {
  const totalMonths = yearsRemaining * 12;

  // Calculate with DCA
  const monthlyRate = Math.pow(1 + requiredCAGR / 100, 1 / 12) - 1;
  const projectedWithDCA = projectWithDCA(portfolioValue, dcaAmount, monthlyRate, totalMonths);
  const totalContributed = dcaAmount * totalMonths;

  // Calculate without DCA
  const projectedNoDCA = projectValue(portfolioValue, requiredCAGR, yearsRemaining);

  // Impact of DCA
  const dcaImpact = projectedWithDCA - projectedNoDCA;

  // Determine verdicts
  const verdictWith = projectedWithDCA >= GOAL_TARGET ? "ON TRACK" 
    : projectedWithDCA >= GOAL_TARGET * 0.9 ? "ACHIEVABLE" : "SHORT";
  const verdictColorWith = projectedWithDCA >= GOAL_TARGET ? C.green 
    : projectedWithDCA >= GOAL_TARGET * 0.9 ? C.cyan : C.gold;

  const verdictWithout = projectedNoDCA >= GOAL_TARGET ? "ON TRACK" 
    : projectedNoDCA >= GOAL_TARGET * 0.9 ? "ACHIEVABLE" : "SHORT";
  const verdictColorWithout = projectedNoDCA >= GOAL_TARGET ? C.green 
    : projectedNoDCA >= GOAL_TARGET * 0.9 ? C.cyan : C.gold;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    if (onDCAChange) onDCAChange(val);
  };

  const handleInputChange = (e) => {
    const val = Number(e.target.value) || 0;
    if (onDCAChange) onDCAChange(Math.max(0, val));
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", marginBottom: 20 }}>
      <SectionLabel sub="Simulate portfolio trajectory at different monthly DCA amounts">DCA Sensitivity Analysis</SectionLabel>

      {/* Slider + input row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 8, letterSpacing: "0.1em" }}>MONTHLY DCA AMOUNT</div>
          <input
            type="range"
            min="0"
            max="50000"
            step="100"
            value={dcaAmount}
            onChange={handleSliderChange}
            style={{
              width: "100%", height: 6, borderRadius: 3,
              background: C.border, outline: "none", cursor: "pointer",
              WebkitAppearance: "none",
              appearance: "none",
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: ${C.blue};
              cursor: pointer;
              box-shadow: 0 0 8px ${C.blue}60;
              border: 2px solid ${C.surface};
            }
            input[type="range"]::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: ${C.blue};
              cursor: pointer;
              border: 2px solid ${C.surface};
              box-shadow: 0 0 8px ${C.blue}60;
            }
          `}</style>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>$0</span>
            <span style={{ flex: 1, textAlign: "center", ...mono, fontSize: 10, color: C.textMuted }}>$10k</span>
            <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>$50k+</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, letterSpacing: "0.1em" }}>ENTER AMOUNT</div>
          <input
            type="number"
            min="0"
            value={dcaAmount}
            onChange={handleInputChange}
            style={{
              ...mono, fontSize: 14, fontWeight: 700, color: C.blue,
              background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "8px 12px", width: 140, textAlign: "right",
              outline: "none",
            }}
            onFocus={(e) => e.target.style.borderColor = C.blue}
            onBlur={(e) => e.target.style.borderColor = C.border}
          />
        </div>
      </div>

      {/* Side-by-side comparison: With DCA vs Without DCA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* WITH DCA */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 4, letterSpacing: "0.1em" }}>WITH DCA ({fmtMoney(dcaAmount)}/mo)</div>
            <div style={{
              display: "inline-block",
              padding: "6px 12px", borderRadius: 4, background: `${verdictColorWith}15`,
              border: `1px solid ${verdictColorWith}40`,
              ...mono, fontSize: 11, fontWeight: 700, color: verdictColorWith, letterSpacing: "0.08em",
            }}>
              {verdictWith}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 3 }}>TOTAL 2037 VALUE</div>
            <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.text }}>
              {fmtMoney(projectedWithDCA)}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 3 }}>vs $1M GOAL</div>
            <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: projectedWithDCA >= GOAL_TARGET ? C.green : C.gold }}>
              {projectedWithDCA >= GOAL_TARGET ? "+" : ""}{fmtMoney(projectedWithDCA - GOAL_TARGET)}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 3 }}>REQUIRED CAGR</div>
            <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.cyan }}>
              {fmtCAGR(requiredCAGR)}
            </div>
          </div>

          <div style={{ marginTop: 12, ...mono, fontSize: 9, color: C.textMuted, lineHeight: 1.5 }}>
            Total contributed: {fmtMoney(totalContributed)}
          </div>
        </div>

        {/* WITHOUT DCA */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginBottom: 4, letterSpacing: "0.1em" }}>WITHOUT DCA (Organic only)</div>
            <div style={{
              display: "inline-block",
              padding: "6px 12px", borderRadius: 4, background: `${verdictColorWithout}15`,
              border: `1px solid ${verdictColorWithout}40`,
              ...mono, fontSize: 11, fontWeight: 700, color: verdictColorWithout, letterSpacing: "0.08em",
            }}>
              {verdictWithout}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 3 }}>TOTAL 2037 VALUE</div>
            <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.text }}>
              {fmtMoney(projectedNoDCA)}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 3 }}>vs $1M GOAL</div>
            <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: projectedNoDCA >= GOAL_TARGET ? C.green : C.gold }}>
              {projectedNoDCA >= GOAL_TARGET ? "+" : ""}{fmtMoney(projectedNoDCA - GOAL_TARGET)}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 3 }}>DCA IMPACT</div>
            <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.green }}>
              +{fmtMoney(dcaImpact)}
            </div>
          </div>

          <div style={{ marginTop: 12, ...mono, fontSize: 9, color: C.textMuted, lineHeight: 1.5 }}>
            Pure compounding · no contributions
          </div>
        </div>
      </div>

      {/* Impact note */}
      <div style={{
        ...mono, fontSize: 10, color: C.textMuted, padding: "10px 14px", background: C.panel,
        borderRadius: 6, border: `1px solid ${C.border}`, lineHeight: 1.6,
      }}>
        <strong>Slider insight:</strong> {dcaAmount === 0 
          ? "At $0 DCA, you're relying entirely on required CAGR to hit $1M." 
          : `At ${fmtMoney(dcaAmount)}/mo, DCA contributes ${fmtMoney(dcaImpact)} to your 2037 projection — the power of compounding on fresh capital.`}
      </div>
    </div>
  );
}

// ── Per-asset 2037 projection table ──────────────────────────────────────────
function AssetProjectionTable({ positions, portfolioValue, yearsRemaining }) {
  const rows = useMemo(() => {
    if (!positions?.length) return [];
    return positions
      .map(p => {
        const assumed    = CAGR_ASSUMPTIONS[p.symbol] || 15;
        const currentVal = Number(p.liveValue || 0);
        const projected  = projectValue(currentVal, assumed, yearsRemaining);
        const gain       = projected - currentVal;
        const weight     = portfolioValue > 0 ? (currentVal / portfolioValue) * 100 : 0;
        const contribution = (gain / GOAL_TARGET) * 100;
        return { symbol: p.symbol, currentVal, projected, gain, weight, assumed, contribution };
      })
      .sort((a, b) => b.projected - a.projected);
  }, [positions, portfolioValue, yearsRemaining]);

  const totalProjected = rows.reduce((s, r) => s + r.projected, 0);
  const totalGain      = totalProjected - portfolioValue;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
        <SectionLabel sub="Assumed CAGRs based on conviction tier — not a forecast">Per-Asset 2037 Projection</SectionLabel>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>Total projected 2037</div>
            <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: totalProjected >= GOAL_TARGET ? C.green : C.gold }}>
              {fmtMoney(totalProjected)}
            </div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>vs $1M goal</div>
            <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: deltaColor(totalProjected - GOAL_TARGET) }}>
              {totalProjected >= GOAL_TARGET ? "+" : ""}{fmtMoney(totalProjected - GOAL_TARGET)}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 80px 80px",
        padding: "10px 24px", borderBottom: `1px solid ${C.border}`,
        ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        <span>Asset</span>
        <span>Current</span>
        <span>Projected 2037</span>
        <span>Gain</span>
        <span>CAGR</span>
        <span>Goal %</span>
      </div>

      {rows.map((r, i) => (
        <div key={r.symbol} style={{
          display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 80px 80px",
          padding: "12px 24px",
          borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
          alignItems: "center",
        }}>
          <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.text }}>{r.symbol}</span>

          <div>
            <div style={{ ...mono, fontSize: 12, color: C.textSec }}>{fmtMoney(r.currentVal)}</div>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>{r.weight.toFixed(1)}% weight</div>
          </div>

          <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: r.projected >= r.currentVal * 2 ? C.green : C.text }}>
            {fmtMoney(r.projected)}
          </div>

          <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.green }}>
            +{fmtMoney(r.gain)}
          </div>

          <div>
            <div style={{ ...mono, fontSize: 11, color: C.gold }}>{r.assumed}%</div>
            <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>assumed</div>
          </div>

          <div style={{ ...mono, fontSize: 11, color: C.cyan }}>
            {r.contribution.toFixed(1)}%
          </div>
        </div>
      ))}

      {/* Total row */}
      <div style={{
        display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 80px 80px",
        padding: "14px 24px",
        background: C.panel,
        borderTop: `1px solid ${C.borderAcc}`,
        alignItems: "center",
      }}>
        <span style={{ ...mono, fontSize: 11, color: C.textMuted, fontWeight: 700 }}>TOTAL</span>
        <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.text }}>{fmtMoney(portfolioValue)}</div>
        <div style={{ ...mono, fontSize: 13, fontWeight: 800, color: totalProjected >= GOAL_TARGET ? C.green : C.gold }}>
          {fmtMoney(totalProjected)}
        </div>
        <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.green }}>+{fmtMoney(totalGain)}</div>
        <span />
        <span />
      </div>
    </div>
  );
}

// ── Gap analysis ──────────────────────────────────────────────────────────────
function GapAnalysis({ portfolioValue, requiredCAGR, goal }) {
  const yearsRemaining = goal?.yearsRemaining || 0;
  const gap            = GOAL_TARGET - portfolioValue;
  const isOnTrack      = requiredCAGR <= 28; // <=28% is aggressive but achievable
  const verdict        = requiredCAGR <= 20 ? "ON TRACK"
    : requiredCAGR <= 28 ? "ACHIEVABLE"
    : requiredCAGR <= 40 ? "STRETCH"
    : "AGGRESSIVE";
  const verdictColor   = requiredCAGR <= 20 ? C.green
    : requiredCAGR <= 28 ? C.cyan
    : requiredCAGR <= 40 ? C.gold
    : C.red;

  // What monthly contribution would the portfolio need to grow at exactly 20% CAGR?
  const targetCAGR   = 20;
  const projAt20     = projectValue(portfolioValue, targetCAGR, yearsRemaining);
  const shortfall20  = Math.max(0, GOAL_TARGET - projAt20);

  return (
    <div style={{ background: C.surface, border: `1px solid ${verdictColor}30`, borderRadius: 10, padding: "22px 24px", marginBottom: 20 }}>
      <SectionLabel sub="Based on live portfolio value and time to 2037">Goal Feasibility Assessment</SectionLabel>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          padding: "8px 18px", borderRadius: 6,
          background: `${verdictColor}15`, border: `1px solid ${verdictColor}40`,
          ...mono, fontSize: 14, fontWeight: 800, color: verdictColor, letterSpacing: "0.08em",
        }}>
          {verdict}
        </div>
        <div style={{ ...mono, fontSize: 12, color: C.textSec }}>
          {fmtCAGR(requiredCAGR)} required to reach $1M by {GOAL_YEAR}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <div style={{ background: C.panel, borderRadius: 8, padding: "14px 16px", border: `1px solid ${C.border}` }}>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 6, letterSpacing: "0.1em" }}>GAP TO $1M</div>
          <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.text }}>{fmtMoney(gap)}</div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 3 }}>{((gap / GOAL_TARGET) * 100).toFixed(1)}% remaining</div>
        </div>
        <div style={{ background: C.panel, borderRadius: 8, padding: "14px 16px", border: `1px solid ${C.border}` }}>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 6, letterSpacing: "0.1em" }}>AT 20% CAGR</div>
          <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: projAt20 >= GOAL_TARGET ? C.green : C.gold }}>
            {fmtMoney(projAt20)}
          </div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 3 }}>
            {projAt20 >= GOAL_TARGET ? "Exceeds goal" : `${fmtMoney(shortfall20)} short`}
          </div>
        </div>
        <div style={{ background: C.panel, borderRadius: 8, padding: "14px 16px", border: `1px solid ${C.border}` }}>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 6, letterSpacing: "0.1em" }}>YEARS REMAINING</div>
          <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.text }}>{yearsRemaining.toFixed(1)}</div>
          <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 3 }}>to Jan 1, {GOAL_YEAR}</div>
        </div>
      </div>

      {/* CAGR scenarios */}
      <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        CAGR Scenario Outcomes
      </div>
      {[
        { label: "Conservative",  cagr: 15, color: C.blue  },
        { label: "Moderate",      cagr: 20, color: C.cyan  },
        { label: "Target",        cagr: 28, color: C.green },
        { label: "Required",      cagr: requiredCAGR, color: verdictColor },
      ].map(s => {
        const proj = projectValue(portfolioValue, s.cagr, yearsRemaining);
        const barW = Math.min((proj / GOAL_TARGET) * 100, 100);
        return (
          <div key={s.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ ...mono, fontSize: 10, color: C.textSec }}>{s.label} ({s.cagr.toFixed(0)}% / yr)</span>
              <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: proj >= GOAL_TARGET ? C.green : s.color }}>
                {fmtMoney(proj)} {proj >= GOAL_TARGET ? "\u2713" : ""}
              </span>
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                width: `${barW}%`, height: "100%", background: s.color,
                borderRadius: 2, transition: "width 0.6s ease",
                boxShadow: proj >= GOAL_TARGET ? `0 0 6px ${s.color}60` : "none",
              }} />
            </div>
          </div>
        );
      })}

      <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 16, lineHeight: 1.6, padding: "10px 14px", background: C.panel, borderRadius: 6, border: `1px solid ${C.border}` }}>
        Note: projections use assumed per-asset CAGRs based on conviction tier. Market conditions, macro regime, and reallocation decisions will shift outcomes materially. This is a planning tool, not a forecast.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GoalEngine() {
  const [kellyData,    setKellyData]    = useState(null);
  const [valuation,    setValuation]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [dcaAmount,    setDcaAmount]    = useState(500); // Lift state to main component

  const load = useCallback(async () => {
    try {
      const [kelly, val] = await Promise.all([
        window.jupiter.invoke("decisions:getKellyRecommendations"),
        window.jupiter.invoke("portfolio:getValuation"),
      ]);
      setKellyData(kelly);
      setValuation(val);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("[GoalEngine] load failed:", err);
      setError(err?.message || "Failed to load goal intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goal           = kellyData?.goal           || null;
  const portfolioValue = kellyData?.portfolioValue || 0;
  const requiredCAGR   = goal?.requiredCAGR        || 0;
  const progressPct    = goal?.progressPct         || 0;
  const yearsRemaining = goal?.yearsRemaining      || (GOAL_YEAR - new Date().getFullYear());
  const positions      = useMemo(() => valuation?.positions || [], [valuation]);

  if (loading) {
    return (
      <div style={{ ...mono, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>
        Loading goal intelligence\u2026
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...mono, background: C.bg, minHeight: "100vh", padding: "32px", color: C.red, fontSize: 13 }}>
        \u26a0 {error}
        <button onClick={load} style={{ ...mono, marginLeft: 16, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.red}40`, background: "transparent", color: C.red, cursor: "pointer", fontSize: 12 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      ...mono, background: C.bg, minHeight: "100vh", color: C.text,
      padding: "28px 32px", maxWidth: 1100, margin: "0 auto",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Goal Engine</h1>
          <p style={{ ...mono, fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>
            $100k \u2192 $1M by {GOAL_YEAR} \u00b7 live trajectory intelligence \u00b7 read-only
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastRefresh && (
            <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>{lastRefresh.toLocaleTimeString()}</span>
          )}
          <button
            onClick={load}
            style={{
              ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              padding: "8px 16px", borderRadius: 6,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.textSec, cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Goal progress hero */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "24px 28px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>PORTFOLIO VALUE</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {fmtMoney(portfolioValue)}
            </div>
            <div style={{ ...mono, fontSize: 12, color: C.textMuted, marginTop: 6 }}>
              {fmtMoney(GOAL_TARGET - portfolioValue)} remaining to goal
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 4 }}>GOAL PROGRESS</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: C.blue, letterSpacing: "-0.02em" }}>
              {progressPct.toFixed(1)}%
            </div>
            <div style={{ ...mono, fontSize: 11, color: C.textMuted, marginTop: 4 }}>of $1M</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 10, background: C.border, borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
          <div style={{
            width: `${Math.min(progressPct, 100)}%`, height: "100%",
            background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`,
            borderRadius: 5, transition: "width 0.8s ease",
            boxShadow: `0 0 8px ${C.blue}60`,
          }} />
        </div>

        {/* Milestones */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[
            { label: "$100k", val: 100_000 },
            { label: "$250k", val: 250_000 },
            { label: "$500k", val: 500_000 },
            { label: "$750k", val: 750_000 },
            { label: "$1M",   val: 1_000_000 },
          ].map(m => {
            const reached = portfolioValue >= m.val;
            return (
              <span key={m.label} style={{
                ...mono, fontSize: 10, fontWeight: reached ? 700 : 400,
                color: reached ? C.blue : C.textDim,
              }}>
                {reached ? "\u2713 " : ""}{m.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Key metrics strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard
          label="Required CAGR"
          value={fmtCAGR(requiredCAGR)}
          sub={`to hit $1M by ${GOAL_YEAR}`}
          color={requiredCAGR <= 20 ? C.green : requiredCAGR <= 28 ? C.cyan : requiredCAGR <= 40 ? C.gold : C.red}
        />
        <StatCard
          label="Years Remaining"
          value={yearsRemaining.toFixed(1)}
          sub={`to Jan 1, ${GOAL_YEAR}`}
          color={C.text}
        />
        <StatCard
          label="Kelly Heat"
          value={`${kellyData?.heatCheck?.totalHeat?.toFixed(1) || "\u2014"}%`}
          sub={kellyData?.heatCheck?.status || "\u2014"}
          color={
            kellyData?.heatCheck?.status === "OVERHEATED" ? C.red :
            kellyData?.heatCheck?.status === "ELEVATED"   ? C.gold : C.green
          }
        />
        <StatCard
          label="Months to 2037"
          value={goal?.monthsRemaining || "\u2014"}
          sub="calendar months"
          color={C.textSec}
        />
      </div>

      {/* Compounding curve */}
      <CompoundingCurve
        portfolioValue={portfolioValue}
        requiredCAGR={requiredCAGR}
        goalTarget={GOAL_TARGET}
        dcaAmount={dcaAmount}
      />

      {/* DCA Sensitivity Slider — INSERTED ABOVE GapAnalysis */}
      <DcaSensitivitySlider
        portfolioValue={portfolioValue}
        requiredCAGR={requiredCAGR}
        yearsRemaining={yearsRemaining}
        dcaAmount={dcaAmount}
        onDCAChange={setDcaAmount}
      />

      {/* Gap / feasibility */}
      <GapAnalysis
        portfolioValue={portfolioValue}
        requiredCAGR={requiredCAGR}
        goal={goal}
      />

      {/* Per-asset projection table */}
      <AssetProjectionTable
        positions={positions}
        portfolioValue={portfolioValue}
        yearsRemaining={yearsRemaining}
      />

      {/* Footer note */}
      <div style={{
        ...mono, fontSize: 10, color: C.textDim, textAlign: "center", marginTop: 8, lineHeight: 1.6,
      }}>
        Goal Engine is read-only \u00b7 all projections are mathematical illustrations, not predictions \u00b7 rebalance in Decisions tab
      </div>
    </div>
  );
}
