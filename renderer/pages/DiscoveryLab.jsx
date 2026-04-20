import { C } from "../styles/colorScheme.js";
/**
 * DiscoveryLab.jsx — JUPITER Intelligence Surface (V2)
 * Upgraded: per-asset differentiation, goal anchoring, re-entry watchlist,
 * theme acceleration ranking, tactical signals layer.
 * Drop into: renderer/pages/DiscoveryLab.jsx
 *
 * FIXES APPLIED:
 *   - \u00d7 unicode escape now renders as × character (not literal text)
 *   - ThemeCard confidence badge normalises case (high/medium/low → High/Medium/Low)
 *   - ThemeCard badge colour handles lowercase confidence from runEmergingThemesScan
 */

import { useEffect, useMemo, useState, useCallback } from "react";

// ─── Colour tokens (matches Portfolio + MoonshotLab system) ──────────────────

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPct(n)   { return (Number(n) * 100).toFixed(1) + "%"; }
function fmtScore(n) { return Number(n ?? 0).toFixed(2); }
function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function deltaColor(v) {
  const n = Number(v);
  if (n > 0) return C.green;
  if (n < 0) return C.red;
  return C.textMuted;
}
function convictionLabel(n) {
  const x = Number(n ?? 0);
  if (x >= 0.7) return { label: "High",   color: C.green };
  if (x >= 0.4) return { label: "Medium", color: C.gold  };
  return              { label: "Low",    color: C.red   };
}
function decisionColor(d) {
  if (d === "BUY" || d === "BUY_MORE")      return C.green;
  if (d === "HOLD")                          return C.blue;
  if (d === "TRIM" || d === "AVOID")         return C.gold;
  if (d === "EXIT_OR_AVOID")                 return C.red;
  return C.textMuted;
}
function getSymbol(r) { return r?.symbol?.symbol || r?.symbol || ""; }

// Project 2037 growth on a position at given CAGR proxy
function project2037(positionValue, cagrProxy) {
  const years = Math.max(1, 2037 - new Date().getFullYear());
  const cagr  = Math.max(0.05, cagrProxy);
  return positionValue * Math.pow(1 + cagr, years);
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return (
    <span style={{
      ...mono,
      display: "inline-block",
      padding: "2px 7px",
      borderRadius: 3,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.1em",
      color:      color || C.text,
      background: bg   || (color ? color + "18" : C.surface),
      border:     `1px solid ${color ? color + "40" : C.border}`,
    }}>
      {label}
    </span>
  );
}

function SectionLabel({ children, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: C.textMuted, textTransform: "uppercase" }}>
        {children}
      </div>
      {sub && <div style={{ ...mono, fontSize: 9, color: C.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "24px 0" }} />;
}

// ─── Factor bar ───────────────────────────────────────────────────────────────
function FactorRow({ label, value, max, color }) {
  const safeMax = max || 3;
  const pct = Math.min(Math.abs(Number(value)) / safeMax, 1) * 100;
  const col = color || (Number(value) >= 0 ? C.green : C.red);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
      <div style={{ ...mono, fontSize: 9, color: C.textMuted, width: 72, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: pct + "%", height: "100%",
          background: col,
          borderRadius: 2,
          boxShadow: `0 0 4px ${col}60`,
          transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: col, width: 40, textAlign: "right" }}>
        {Number(value) > 0 ? "+" : ""}{fmtScore(value)}
      </div>
    </div>
  );
}

// ─── Tactical signals ─────────────────────────────────────────────────────────
function TacticalSignals({ tactical }) {
  if (!tactical) return null;
  const breakdown = tactical.breakdown || {};
  const score     = tactical.score ?? tactical.tacticalScore ?? null;
  const entries   = Object.entries(breakdown).filter(([, v]) => typeof v === "number");
  if (entries.length === 0 && score == null) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.12em", marginBottom: 7 }}>
        TACTICAL SIGNALS
      </div>
      {score != null && (
        <FactorRow label="overall" value={score} max={1} color={score >= 0.5 ? C.green : C.gold} />
      )}
      {entries.map(([k, v]) => (
        <FactorRow key={k} label={k.replace(/([A-Z])/g, " $1").toLowerCase()} value={v} max={1} />
      ))}
    </div>
  );
}

// ─── Fundamentals audit pills ─────────────────────────────────────────────────
function AuditPills({ audit }) {
  if (!audit?.categories) return null;
  const statusColor = { PASS: C.green, WARN: C.gold, FAIL: C.red };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {Object.entries(audit.categories).map(([k, v]) => (
        <span key={k} title={v.rationale} style={{
          ...mono, fontSize: 8, padding: "2px 6px", borderRadius: 2, cursor: "help",
          background: (statusColor[v.status] || C.textMuted) + "18",
          border:     `1px solid ${(statusColor[v.status] || C.textMuted)}40`,
          color:      statusColor[v.status] || C.textMuted,
        }}>
          {k.replace(/([A-Z])/g, " $1").trim()} · {v.status}
        </span>
      ))}
    </div>
  );
}

// ─── Goal contribution chip ───────────────────────────────────────────────────
function GoalChip({ trajectoryScore, goalRemaining, positionValue }) {
  if (!goalRemaining || !positionValue) return null;
  const projected  = project2037(positionValue, trajectoryScore || 0.25);
  const gain       = projected - positionValue;
  const closePct   = goalRemaining > 0 ? Math.min((gain / goalRemaining) * 100, 999) : 0;
  return (
    <span style={{
      ...mono, display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 3,
      background: C.goldDim, border: `1px solid ${C.gold}30`,
      fontSize: 9, color: C.gold,
    }}>
      ▲ 2037 · <strong>{fmtMoney(gain)}</strong> gain · closes {closePct.toFixed(1)}% of gap
    </span>
  );
}

// ─── Candidate card ───────────────────────────────────────────────────────────
function CandidateCard({ r, expanded, onToggle, goalRemaining, portfolioValue, rank }) {
  const sym        = getSymbol(r);
  const decision   = r?.decision?.decision || "NONE";
  const conv       = Number(r?.conviction?.normalized ?? 0);
  const convInfo   = convictionLabel(conv);
  const factors    = r?.factorAttribution || {};
  const tactical   = r?.tactical     || null;
  const trajectory = r?.trajectoryMatch || null;
  const audit      = r?.fundamentalsAudit || null;
  const regime     = r?.regime?.label || "—";
  const summary    = r?.explanation?.plainEnglishSummary || null;
  const decCol     = decisionColor(decision);
  const cagrProxy  = trajectory?.score || 0.25;
  const pos5pct    = portfolioValue ? portfolioValue * 0.05 : 5000;
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.panelHov : C.surface,
        border: `1px solid ${expanded ? C.borderAcc : C.border}`,
        borderLeft: `3px solid ${decCol}`,
        borderRadius: 8,
        transition: "all 0.18s ease",
        overflow: "hidden",
      }}
    >
      {/* Rich always-visible card */}
      <div style={{ padding: "16px 18px" }}>
        {/* Top row: rank + symbol + badges + regime */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {rank != null && <span style={{ ...mono, fontSize: 10, color: C.textDim, fontWeight: 700 }}>#{rank}</span>}
          <span style={{ ...mono, fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>{sym}</span>
          <Badge label={decision} color={decCol} />
          <Badge label={convInfo.label} color={convInfo.color} />
          {trajectory?.label && trajectory.label !== "NO_MATCH" && (
            <Badge label={trajectory.label.replace(/_/g, " ")} color={C.cyan} />
          )}
          <span style={{ ...mono, fontSize: 9, color: C.textDim, marginLeft: "auto" }}>{regime}</span>
        </div>

        {/* Middle: factor bars + synthesis side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: factor bars */}
          <div>
            {Object.entries(factors).slice(0, 4).map(([k, v]) => (
              <FactorRow key={k} label={k} value={v} max={3} />
            ))}
            {tactical?.score != null && (
              <FactorRow label="tactical" value={tactical.score} max={1} color={tactical.score >= 0.5 ? C.green : C.gold} />
            )}
          </div>
          {/* Right: synthesis */}
          <div>
            {summary ? (
              <div style={{ ...mono, fontSize: 10, color: C.textSec, lineHeight: 1.6 }}>
                {summary.length > 180 ? summary.slice(0, 180) + "…" : summary}
              </div>
            ) : (
              <div style={{ ...mono, fontSize: 10, color: C.textDim }}>No synthesis available</div>
            )}
          </div>
        </div>

        {/* Bottom: conviction bar + goal chip + expand toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, maxWidth: 180, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: fmtPct(conv), height: "100%", background: convInfo.color, boxShadow: `0 0 5px ${convInfo.color}60`, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: convInfo.color }}>{(conv * 100).toFixed(1)}%</span>
          {trajectory?.available && goalRemaining > 0 && (
            <GoalChip trajectoryScore={cagrProxy} goalRemaining={goalRemaining} positionValue={pos5pct} />
          )}
          <button onClick={onToggle} style={{ marginLeft: "auto", ...mono, fontSize: 9, color: C.textMuted, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", letterSpacing: "0.08em" }}>
            {expanded ? "COLLAPSE ▲" : "FULL DETAIL ▼"}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: "14px 18px 18px",
          borderTop: `1px solid ${C.border}`,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
          animation: "fadeIn 0.18s ease",
        }}>
          <div>
            <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.12em", marginBottom: 8 }}>FACTOR ATTRIBUTION</div>
            {Object.entries(factors).length > 0
              ? Object.entries(factors).map(([k, v]) => <FactorRow key={k} label={k} value={v} max={3} />)
              : <span style={{ ...mono, fontSize: 10, color: C.textDim }}>No attribution data</span>
            }
            <TacticalSignals tactical={tactical} />
          </div>

          {/* Right col */}
          <div>
            {trajectory?.available && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.12em", marginBottom: 6 }}>
                  TRAJECTORY MATCH
                </div>
                <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.cyan }}>
                  {trajectory.label?.replace(/_/g, " ") || "—"}
                </div>
                <div style={{ ...mono, fontSize: 10, color: C.textSec, marginTop: 4, lineHeight: 1.55 }}>
                  {trajectory.explanation}
                </div>
                <div style={{ marginTop: 8 }}>
                  <FactorRow label="confidence" value={trajectory.confidence ?? trajectory.score ?? 0} max={1} color={C.cyan} />
                </div>
              </div>
            )}
            {audit && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.12em", marginBottom: 4 }}>
                  FUNDAMENTALS ·{" "}
                  <span style={{ color: audit.overallStatus === "PASS" ? C.green : C.red }}>
                    {audit.overallStatus}
                  </span>
                </div>
                <AuditPills audit={audit} />
              </div>
            )}
            {summary && (
              <div>
                <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.12em", marginBottom: 4 }}>
                  ENGINE SYNTHESIS
                </div>
                <div style={{ ...mono, fontSize: 10, color: C.textSec, lineHeight: 1.6 }}>{summary}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Re-entry card ────────────────────────────────────────────────────────────
function ReEntryCard({ r }) {
  const sym = getSymbol(r);
  const [open, setOpen] = useState(false);
  const factors = r?.factorAttribution || {};
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.red}50`, borderRadius: 8,
        padding: "12px 16px", cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.text }}>{sym}</span>
          <Badge label="REJECTED" color={C.red} />
          {r?.regime?.label && <span style={{ ...mono, fontSize: 9, color: C.textDim }}>{r.regime.label}</span>}
        </div>
        <span style={{ ...mono, fontSize: 10, color: C.textDim }}>{open ? "▲" : "▼"}</span>
      </div>

      {r?.rejectionReason && (
        <div style={{ ...mono, fontSize: 10, color: C.red, marginTop: 6 }}>
          ⚠ {r.rejectionReason}
        </div>
      )}

      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, animation: "fadeIn 0.18s ease" }}>
          {Object.entries(factors).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...mono, fontSize: 9, color: C.textDim, marginBottom: 7 }}>CURRENT FACTORS</div>
              {Object.entries(factors).map(([k, v]) => <FactorRow key={k} label={k} value={v} max={3} />)}
            </div>
          )}
          <div style={{ ...mono, fontSize: 9, color: C.textDim, marginBottom: 7 }}>WHAT NEEDS TO CHANGE</div>
          {[
            "Conviction normalization must rise above 0.40",
            "Fundamental quality or growth factors must improve materially",
            "Regime alignment must strengthen relative to scanning universe",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
              <span style={{ color: C.textDim }}>▷</span>
              <span style={{ ...mono, fontSize: 10, color: C.textSec }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Theme card ───────────────────────────────────────────────────────────────
// FIX: normalise confidence case (engine may return "high"/"medium"/"low" or
//      "High"/"Medium"/"Low") — always display consistently and colour correctly.
function ThemeCard({ theme, accelerationScore }) {
  const confidenceNorm = (theme.confidence || "").toUpperCase();
  const col =
    accelerationScore >= 0.6
      ? C.green
      : accelerationScore >= 0.35
      ? C.gold
      : confidenceNorm === "HIGH"
      ? C.green
      : confidenceNorm === "MEDIUM"
      ? C.gold
      : confidenceNorm === "LOW"
      ? C.red
      : C.textMuted;

  // Display label: capitalise first letter only e.g. "High", "Medium", "Low"
  const confidenceDisplay =
    confidenceNorm.charAt(0) + confidenceNorm.slice(1).toLowerCase();

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "14px 18px", display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.text }}>{theme.label}</span>
          <Badge label={confidenceDisplay} color={col} />
        </div>
        <div style={{ ...mono, fontSize: 10, color: C.textSec, lineHeight: 1.6, marginBottom: 8 }}>
          {theme.explanation}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(theme.symbols || []).map(s => (
            <span key={s} style={{ ...mono, fontSize: 9, color: C.cyan, background: C.cyanDim, padding: "1px 6px", borderRadius: 2, border: `1px solid ${C.cyan}30` }}>{s}</span>
          ))}
          {(theme.drivers || []).map(d => (
            <span key={d} style={{ ...mono, fontSize: 9, color: C.textMuted, background: C.border + "80", padding: "1px 5px", borderRadius: 2 }}>{d}</span>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: col }}>
          {(accelerationScore * 100).toFixed(0)}
        </div>
        <div style={{ ...mono, fontSize: 8, color: C.textDim }}>ACCEL</div>
      </div>
    </div>
  );
}

// ─── Goal banner ──────────────────────────────────────────────────────────────
function GoalBanner({ goal, portfolioValue }) {
  if (!goal) return null;
  const prog = Math.min(Number(goal.progressPct || 0), 100);
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "16px 20px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.16em", marginBottom: 4 }}>
            COMPOUNDING TARGET
          </div>
          <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.text }}>
            $100k → $1M by 2037
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.textSec, marginTop: 4 }}>
            {fmtMoney(goal.remaining)} remaining · requires {goal.requiredCAGR}% CAGR
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...mono, fontSize: 28, fontWeight: 800, color: C.blue }}>{prog.toFixed(1)}%</div>
          <div style={{ ...mono, fontSize: 9, color: C.textDim }}>of goal</div>
        </div>
      </div>
      <div style={{ marginTop: 12, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: prog + "%", height: "100%", background: C.blue, borderRadius: 3,
          boxShadow: `0 0 8px ${C.blue}60`, transition: "width 0.8s ease",
        }} />
      </div>
      <div style={{ ...mono, fontSize: 9, color: C.textDim, marginTop: 6 }}>
        Candidate projections use 5% position ({fmtMoney(portfolioValue * 0.05)}) as illustration
      </div>
    </div>
  );
}

// ─── Manual research panel ────────────────────────────────────────────────────
function ManualResearchPanel({ goalRemaining, portfolioValue }) {
  const [sym,         setSym]         = useState("");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState("");
  const [aiSynthesis, setAiSynthesis] = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [ownedSymbols, setOwnedSymbols] = useState(new Set());

  useEffect(() => {
    window.jupiter.invoke("holdings:getRaw").then(hdgs => {
      if (Array.isArray(hdgs)) setOwnedSymbols(new Set(hdgs.map(h => h.symbol?.toUpperCase())));
    }).catch(() => {});
  }, []);

  async function run() {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setLoading(true); setResult(null); setError("");
    setAiSynthesis("");
    try {
      const isOwned = ownedSymbols.has(s);
      const r = await window.jupiter.invoke("discovery:analyze:symbol", { symbol: s, ownership: isOwned });
      setResult(r || null);
      setLoading(false);

      // Fire Jupiter AI synthesis in parallel
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (apiKey && r?.result) {
        setAiLoading(true);
        const m = r.result;
        const factors = m?.factorAttribution || {};
        const trajectory = m?.trajectoryMatch || null;
        const audit = m?.fundamentalsAudit || null;
        const decision = m?.decision?.decision || "NONE";
        const conv = Number(m?.conviction?.normalized ?? 0);
        const price = r?.price?.price ?? null;

        const factorLines = Object.entries(factors).map(([k,v]) => `  ${k}: ${Number(v)>0?"+":""}${Number(v).toFixed(2)}`).join("\n");
        const auditLines = audit?.categories ? Object.entries(audit.categories).map(([k,v]) => `  ${k}: ${v.status}`).join("\n") : "unavailable";

        const pos5pct = portfolioValue * 0.05;
        const years = Math.max(1, 2037 - new Date().getFullYear());
        const cagrProxy = trajectory?.score || 0.25;
        const projected2037 = pos5pct * Math.pow(1 + cagrProxy, years);
        const projectedGain = projected2037 - pos5pct;
        const gapClosePct = goalRemaining > 0 ? ((projectedGain / goalRemaining) * 100).toFixed(1) : null;
        const isOwned = ownedSymbols.has(s);

        const prompt = `You are JUPITER AI analyzing ${s} for a long-term investor targeting $1M by 2037.

PORTFOLIO CONTEXT:
  Current portfolio value: $${Math.round(portfolioValue).toLocaleString()}
  Goal gap remaining: $${Math.round(goalRemaining).toLocaleString()}
  Years to goal: ${years}
  This holding owned: ${isOwned ? "YES — already in portfolio" : "NO — not currently held"}

CANDIDATE DATA:
  Decision: ${decision}
  Conviction: ${(conv*100).toFixed(1)}%
  Trajectory: ${trajectory?.label?.replace(/_/g," ") || "unknown"}
  Price: ${price ? "$"+Number(price).toFixed(2) : "unknown"}
  5% position size: $${Math.round(pos5pct).toLocaleString()}
  Projected 2037 value (5% pos): $${Math.round(projected2037).toLocaleString()}
  Projected gain: $${Math.round(projectedGain).toLocaleString()}${gapClosePct ? ` — closes ${gapClosePct}% of goal gap` : ""}

FACTOR SCORES:
${factorLines || "  none available"}

FUNDAMENTALS:
${auditLines}

ENGINE SYNTHESIS:
${m?.explanation?.plainEnglishSummary || "none"}

Write a 3-4 sentence investment intelligence brief on ${s}. Be specific to this data. Lead with what the factor scores reveal. ${!isOwned && gapClosePct ? `Since this is not currently held, explicitly state that a 5% position could close ${gapClosePct}% of the remaining goal gap by 2037.` : isOwned ? "Since this is already held, comment on whether the current position sizing is appropriate given the factor scores." : ""} End with one concrete implication. No headers. No bold. Under 140 words.`;

        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-6",
              max_tokens: 300,
              stream: true,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (res.ok) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let aiText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop();
              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const data = line.slice(5).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                    aiText += parsed.delta.text;
                    setAiSynthesis(aiText);
                  }
                } catch(e) {}
              }
            }
          }
        } catch(e) {
          console.warn("[DiscoveryLab] AI synthesis failed:", e);
        } finally {
          setAiLoading(false);
        }
      }
    } catch {
      setError("Symbol not found or analysis unavailable.");
      setLoading(false);
    }
  }

  const manual     = result?.result || null;
  const priceData  = result?.price || null;
  const decision   = manual?.decision?.decision || "NONE";
  const conv       = Number(manual?.conviction?.normalized ?? 0);
  const convInfo   = convictionLabel(conv);
  const factors    = manual?.factorAttribution || {};
  const tactical   = manual?.tactical           || null;
  const trajectory = manual?.trajectoryMatch    || null;
  const audit      = manual?.fundamentalsAudit  || null;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "16px 20px", marginBottom: 20,
    }}>
      <div style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
        MANUAL RESEARCH <span style={{ color: C.textDim, fontWeight: 400 }}>· User-driven · Immediate</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={sym}
          onChange={e => setSym(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && run()}
          placeholder="TICKER"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
          style={{
            flex: 1, ...mono, fontSize: 14, fontWeight: 700, padding: "10px 14px",
            background: "#0a0f1a", border: `1px solid ${C.borderAcc}`,
            borderRadius: 6, color: C.text, outline: "none", letterSpacing: "0.08em",
          }}
        />
        <button
          onClick={run} disabled={loading}
          style={{
            ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            padding: "10px 22px", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
            background: loading ? C.panel : C.blue,
            border: `1px solid ${loading ? C.border : C.blue}`,
            color: loading ? C.textMuted : "#000",
          }}
        >
          {loading ? "ANALYZING…" : "ANALYZE"}
        </button>
      </div>

      {error && <div style={{ ...mono, fontSize: 11, color: C.red }}>⚠ {error}</div>}

      {manual && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "0.04em" }}>{sym.toUpperCase()}</span>
            {result?.result?.symbol?.name && result.result.symbol.name !== sym.toUpperCase() && (
              <span style={{ ...mono, fontSize: 11, color: C.textSec }}>{result.result.symbol.name}</span>
            )}
            {priceData?.price != null && (
              <span style={{ ...mono, fontSize: 16, fontWeight: 700, color: "#4ade80" }}>
                ${Number(priceData.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            {priceData?.source && (
              <span style={{ ...mono, fontSize: 9, color: "#6b7280", letterSpacing: "0.06em" }}>
                {priceData.source === "coinbase-spot" ? "LIVE" : priceData.source === "polygon-intraday-delayed" ? "15-MIN DELAY" : "PREV CLOSE"}
              </span>
            )}
            <Badge label={decision} color={decisionColor(decision)} />
            <Badge label={`${convInfo.label} · ${(conv * 100).toFixed(1)}%`} color={convInfo.color} />
            {trajectory?.label && trajectory.label !== "NO_MATCH" && (
              <Badge label={trajectory.label.replace(/_/g, " ")} color={C.cyan} />
            )}
          </div>

          {/* Conviction bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, maxWidth: 300, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: fmtPct(conv), height: "100%", background: convInfo.color, boxShadow: `0 0 6px ${convInfo.color}60` }} />
            </div>
            {trajectory?.available && goalRemaining > 0 && (
              <GoalChip trajectoryScore={trajectory.score} goalRemaining={goalRemaining} positionValue={portfolioValue * 0.05} />
            )}
          </div>

          {/* Split panel: quant left, intelligence right */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* LEFT: quantitative */}
            <div style={{ background: "#060d1a", border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.16em", marginBottom: 10 }}>QUANTITATIVE FACTORS</div>
              {Object.entries(factors).length > 0
                ? Object.entries(factors).map(([k, v]) => <FactorRow key={k} label={k} value={v} max={3} />)
                : <span style={{ ...mono, fontSize: 10, color: C.textDim }}>None available</span>
              }
              <TacticalSignals tactical={tactical} />
              {audit && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>
                    FUNDAMENTALS · <span style={{ color: audit.overallStatus === "PASS" ? C.green : C.red }}>{audit.overallStatus}</span>
                  </div>
                  <AuditPills audit={audit} />
                </div>
              )}
            </div>

            {/* RIGHT: intelligence */}
            <div style={{ background: "#060d1a", border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.16em", marginBottom: 10 }}>INTELLIGENCE SYNTHESIS</div>
              {trajectory?.available && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.cyan, marginBottom: 4 }}>
                    {trajectory.label?.replace(/_/g, " ")}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: C.textSec, lineHeight: 1.6 }}>
                    {trajectory.explanation}
                  </div>
                </div>
              )}
              {(aiSynthesis || aiLoading) && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.12em" }}>JUPITER AI</div>
                    {aiLoading && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4da6ff", animation: "pulse 1s ease-in-out infinite" }} />}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: "#e2e8f0", lineHeight: 1.7 }}>
                    {aiSynthesis || "Generating…"}
                  </div>
                </div>
              )}
              {!aiSynthesis && !aiLoading && manual?.explanation?.plainEnglishSummary && (
                <div style={{ borderTop: trajectory?.available ? `1px solid ${C.border}` : "none", paddingTop: trajectory?.available ? 10 : 0 }}>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>ENGINE SYNTHESIS</div>
                  <div style={{ ...mono, fontSize: 10, color: C.textSec, lineHeight: 1.7 }}>
                    {manual.explanation.plainEnglishSummary}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DiscoveryLab() {
  const [rows,           setRows]           = useState([]);
  const [rejectedRows,   setRejectedRows]   = useState([]);
  const [themes,         setThemes]         = useState([]);
  const [watchlist,      setWatchlist]      = useState([]);
  const [telemetry,      setTelemetry]      = useState(null);
  const [goal,           setGoal]           = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [expandedMap,    setExpandedMap]    = useState({});
  const [activeTab,      setActiveTab]      = useState("surfaced");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [discoveryR, watchlistR, rejectedR, valuationR] = await Promise.allSettled([
          window.jupiter.invoke("discovery:run"),
          window.jupiter.invoke("watchlist:candidates").catch(() => null),
          window.jupiter.invoke("discovery:evaluation:rejected").catch(() => null),
          window.jupiter.invoke("portfolio:getValuation").catch(() => null),
        ]);

        if (!mounted) return;

        const disc = discoveryR.status === "fulfilled" ? discoveryR.value : null;
        setRows(Array.isArray(disc?.canonical) ? disc.canonical : []);
        setThemes(disc?.emergingThemes?.themes || []);
        setTelemetry(disc?.telemetry || null);

        const wl = watchlistR.status === "fulfilled" ? watchlistR.value : null;
        setWatchlist(wl?.candidates || []);

        const rej = rejectedR.status === "fulfilled" ? rejectedR.value : null;
        setRejectedRows(Array.isArray(rej?.rejected) ? rej.rejected : []);

        const valuation = valuationR.status === "fulfilled" ? valuationR.value : null;
        if (valuation) {
          const pv = valuation?.totals?.liveValue || 0;
          setPortfolioValue(pv);
          const GOAL_TARGET = 1_000_000;
          const now = new Date();
          const yearsRemaining = Math.max(0.1, 2037 - now.getFullYear() - now.getMonth()/12);
          const requiredCAGR = pv ? ((Math.pow(GOAL_TARGET / Math.max(pv,1), 1/yearsRemaining) - 1) * 100).toFixed(1) : null;
          const progressPct = Math.min((pv / GOAL_TARGET) * 100, 100);
          const remaining = Math.max(GOAL_TARGET - pv, 0);
          setGoal({ progressPct, remaining, requiredCAGR, yearsRemaining });
        }
      } catch (err) {
        console.error("DiscoveryLab load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Acceleration score = avg(conviction.normalized × trajectoryMatch.score) per theme
  const themedWithAccel = useMemo(() => {
    return themes.map(theme => {
      const members = rows.filter(r => (theme.symbols || []).includes(getSymbol(r)));
      const accel = members.length > 0
        ? members.reduce((sum, r) => {
            return sum + Number(r?.conviction?.normalized ?? 0) * Number(r?.trajectoryMatch?.score ?? 0.25);
          }, 0) / members.length
        : 0;
      return { ...theme, accelerationScore: accel };
    }).sort((a, b) => b.accelerationScore - a.accelerationScore);
  }, [themes, rows]);

  const toggleExpanded = useCallback((key) => {
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const goalRemaining = goal?.remaining || 0;
  const evalCount = telemetry?.evaluatedCount ?? (rows.length + rejectedRows.length);
  const surfCount  = telemetry?.surfacedCount  ?? rows.length;
  const rejCount   = telemetry?.rejectedCount  ?? rejectedRows.length;

  const tabStyle = (active) => ({
    ...mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", cursor: "pointer",
    color: active ? C.text : C.textMuted,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent",
    padding: "10px 16px", transition: "all 0.15s",
  });

  if (loading) {
    return (
      <div style={{ ...mono, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>
        Initialising discovery intelligence…
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
        input::placeholder { color: #374151; }
        input:focus { outline: none; border-color: #3b82f6 !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Discovery Lab</h1>
        <p style={{ ...mono, fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>
          Pre-breakout intelligence surface · read-only · main-process discovery engine
        </p>
      </div>

      {/* Goal banner */}
      <GoalBanner goal={goal} portfolioValue={portfolioValue} />

      {/* Manual research */}
      <ManualResearchPanel goalRemaining={goalRemaining} portfolioValue={portfolioValue} />

      {/* Eval stats */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderBottom: "none",
        borderRadius: "8px 8px 0 0",
        padding: "12px 20px", display: "flex", gap: 24, alignItems: "center",
      }}>
        <div>
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: "0.12em" }}>EVALUATED </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{evalCount}</span>
        </div>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <div style={{ cursor: "pointer" }} onClick={() => setActiveTab("surfaced")}>
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: "0.12em" }}>SURFACED </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{surfCount}</span>
        </div>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <div style={{ cursor: "pointer" }} onClick={() => setActiveTab("rejected")}>
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: "0.12em" }}>REJECTED </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.red }}>{rejCount}</span>
        </div>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <div style={{ cursor: "pointer" }} onClick={() => setActiveTab("themes")}>
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: "0.12em" }}>THEMES </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{themedWithAccel.length}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", background: C.surface,
        border: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 20,
      }}>
        <button style={tabStyle(activeTab === "surfaced")}  onClick={() => setActiveTab("surfaced")}>Surfaced</button>
        <button style={tabStyle(activeTab === "rejected")}  onClick={() => setActiveTab("rejected")}>Re-entry Watchlist</button>
        <button style={tabStyle(activeTab === "themes")}    onClick={() => setActiveTab("themes")}>Themes</button>
        <button style={tabStyle(activeTab === "watchlist")} onClick={() => setActiveTab("watchlist")}>Monitoring</button>
      </div>

      {/* SURFACED */}
      {activeTab === "surfaced" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <SectionLabel sub="Autonomous · Factor-attributed · Trajectory-matched · Click to expand">
            Ranked Candidates
          </SectionLabel>
          {rows.length === 0
            ? <div style={{ textAlign: "center", padding: 48, color: C.textMuted, fontSize: 11 }}>No candidates surfaced under current regime and thresholds.</div>
            : rows.map((r, i) => {
                const key = getSymbol(r) + i;
                return (
                  <CandidateCard key={key} r={r} rank={r.rank ?? i + 1}
                    expanded={!!expandedMap[key]} onToggle={() => toggleExpanded(key)}
                    goalRemaining={goalRemaining} portfolioValue={portfolioValue}
                  />
                );
              })
          }
        </div>
      )}

      {/* RE-ENTRY WATCHLIST */}
      {activeTab === "rejected" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <SectionLabel sub="Failed conviction gate · shows exactly what must change to resurface">
            Re-entry Watchlist
          </SectionLabel>
          {rejectedRows.length === 0
            ? <div style={{ textAlign: "center", padding: 48, color: C.textMuted, fontSize: 11 }}>No rejected candidates in current scan.</div>
            : rejectedRows.map((r, i) => <ReEntryCard key={getSymbol(r) + i} r={r} />)
          }
        </div>
      )}

      {/* THEMES */}
      {activeTab === "themes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
          {/* FIX: × rendered as real character, not \u00d7 escape */}
          <SectionLabel sub="Ranked by acceleration potential (conviction × trajectory score)">
            Structural Themes
          </SectionLabel>
          {themedWithAccel.length === 0
            ? <div style={{ textAlign: "center", padding: 48, color: C.textMuted, fontSize: 11 }}>No structural themes detected.</div>
            : themedWithAccel.map(t => <ThemeCard key={t.themeId} theme={t} accelerationScore={t.accelerationScore} />)
          }

          {/* Trajectory matches within themes tab */}
          {rows.filter(r => r?.trajectoryMatch?.available && r.trajectoryMatch.label !== "NO_MATCH").length > 0 && (
            <>
              <Divider />
              <SectionLabel sub="Structural · Long horizon · Projected at 5% position size">
                Trajectory Matches
              </SectionLabel>
              {rows
                .filter(r => r?.trajectoryMatch?.available && r.trajectoryMatch.label !== "NO_MATCH")
                .map((r, i) => {
                  const traj = r.trajectoryMatch;
                  const pos  = portfolioValue * 0.05 || 5000;
                  const proj = project2037(pos, traj.score || 0.25);
                  return (
                    <div key={getSymbol(r) + i} style={{
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${C.cyan}`, borderRadius: 8, padding: "14px 18px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.text }}>{getSymbol(r)}</span>
                            <Badge label={traj.label.replace(/_/g, " ")} color={C.cyan} />
                            <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: C.cyan }}>
                              {(Number(traj.confidence || traj.score || 0) * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <div style={{ ...mono, fontSize: 10, color: C.textSec, lineHeight: 1.6 }}>{traj.explanation}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                          <div style={{ ...mono, fontSize: 10, color: C.textDim, marginBottom: 2 }}>5% pos → 2037</div>
                          <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: C.green }}>{fmtMoney(proj)}</div>
                          <div style={{ ...mono, fontSize: 9, color: C.textDim }}>from {fmtMoney(pos)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* MONITORING */}
      {activeTab === "watchlist" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <SectionLabel sub="Observational · Medium cadence · Signals mixed">Monitoring Queue</SectionLabel>
          {watchlist.length === 0
            ? <div style={{ textAlign: "center", padding: 48, color: C.textMuted, fontSize: 11 }}>No assets currently meet monitoring criteria.</div>
            : watchlist.map(w => (
                <div key={w.watchId} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "14px 18px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.text }}>{w.symbol}</span>
                      <Badge label={w.confidenceQualifier || "Monitoring"} color={C.gold} />
                      {w.regime && <span style={{ ...mono, fontSize: 9, color: C.textDim }}>{w.regime}</span>}
                    </div>
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: C.textSec, marginBottom: 10, lineHeight: 1.6 }}>{w.monitorReason}</div>
                  {w.upgradeTriggers?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ ...mono, fontSize: 9, color: C.green, letterSpacing: "0.1em", marginBottom: 4 }}>UPGRADE TRIGGERS</div>
                      {w.upgradeTriggers.map((t, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ color: C.green }}>▷</span>
                          <span style={{ ...mono, fontSize: 10, color: C.textSec }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {w.downgradeTriggers?.length > 0 && (
                    <div>
                      <div style={{ ...mono, fontSize: 9, color: C.red, letterSpacing: "0.1em", marginBottom: 4 }}>DOWNGRADE TRIGGERS</div>
                      {w.downgradeTriggers.map((t, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ color: C.red }}>▷</span>
                          <span style={{ ...mono, fontSize: 10, color: C.textSec }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}
