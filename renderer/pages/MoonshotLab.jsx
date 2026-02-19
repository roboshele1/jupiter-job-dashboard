/**
 * MOONSHOT LAB — PRE-BREAKOUT INTELLIGENCE SURFACE
 * -------------------------------------------------
 * Consuming: discovery:run (IPC, read-only)
 * Filter: trajectoryMatch.available === true + BUY/BUY_MORE + conviction >= 0.45
 * Architecture: No local engine — main process scanner IS the moonshot detector
 *
 * Design system: IBM Plex Mono, dark theme (#060910 bg), C token colours
 * Code style: functional, useMemo/useCallback, inline styles only
 * String safety: unicode escapes for all special chars
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";

// ─────────────────────────────────────────────
// COLOUR TOKENS — matches RiskCentre V10 / Portfolio.jsx
// ─────────────────────────────────────────────
const C = {
  bg:          "#060910",
  bgCard:      "#0b1220",
  bgDeep:      "#020617",
  bgPanel:     "#0f172a",
  bgHighlight: "#111827",
  border:      "#1E293B",
  borderFaint: "#0f1a2e",
  text:        "#e2e8f0",
  textMuted:   "#64748b",
  textDim:     "#94a3b8",

  // signal colours
  green:       "#22c55e",
  greenDim:    "#166534",
  greenGlow:   "#15803d",
  amber:       "#f59e0b",
  amberDim:    "#92400e",
  red:         "#ef4444",
  redDim:      "#7f1d1d",
  blue:        "#3b82f6",
  blueDim:     "#1e3a5f",
  purple:      "#a855f7",
  purpleDim:   "#4c1d95",
  cyan:        "#06b6d4",
  cyanDim:     "#164e63",
  teal:        "#14b8a6",
  tealDim:     "#134e4a",

  // moonshot-specific
  moonshot:    "#f59e0b",  // amber — trajectory signal
  moonshotBg:  "#1c1305",
  orbit:       "#a855f7",  // purple — near-miss preview
  orbitBg:     "#130c1f",
  surfaced:    "#22c55e",  // green — confirmed surface
  surfacedBg:  "#061510",
};

// ─────────────────────────────────────────────
// CONVICTION CONFIG — mirrors runDiscoveryScan.js SURFACING_CONFIG
// ─────────────────────────────────────────────
const CONVICTION = {
  SURFACE_MIN:     0.45,
  PREVIEW_MIN:     0.35,
  HIGH_THRESHOLD:  0.70,
  MEDIUM_THRESHOLD: 0.50,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getSymbol(r) {
  return r?.symbol?.symbol || r?.symbol || "";
}

function convictionTier(n) {
  const x = Number(n ?? 0);
  if (x >= CONVICTION.HIGH_THRESHOLD)   return { label: "HIGH",   color: C.green,  bg: C.greenDim };
  if (x >= CONVICTION.MEDIUM_THRESHOLD) return { label: "MED",    color: C.amber,  bg: C.amberDim };
  return                                       { label: "LOW",    color: C.red,    bg: C.redDim };
}

function decisionColour(d) {
  const map = {
    BUY:      { color: C.green,  bg: C.greenDim },
    BUY_MORE: { color: C.teal,   bg: C.tealDim },
    HOLD:     { color: C.blue,   bg: C.blueDim },
    AVOID:    { color: C.red,    bg: C.redDim },
  };
  return map[d] || { color: C.textMuted, bg: C.bgPanel };
}

function fmtPct(n) {
  return (Number(n ?? 0) * 100).toFixed(1) + "%";
}

function fmtConvBar(normalized) {
  const pct = Math.min(100, Math.max(0, Number(normalized ?? 0) * 100));
  const tier = convictionTier(normalized);
  return { pct, color: tier.color };
}

function trajectoryConfidenceLabel(c) {
  const x = Number(c ?? 0);
  if (x >= 0.75) return "Strong";
  if (x >= 0.50) return "Moderate";
  return "Developing";
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Chip / badge — matches RiskCentre V10 driver chips */
function Chip({ label, color, bg, size = "sm" }) {
  const fs = size === "xs" ? "0.65rem" : "0.72rem";
  return (
    <span style={{
      display: "inline-block",
      padding: size === "xs" ? "0.15rem 0.45rem" : "0.2rem 0.55rem",
      borderRadius: "4px",
      fontSize: fs,
      fontWeight: 700,
      letterSpacing: "0.04em",
      color,
      background: bg,
      border: `1px solid ${color}22`,
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {label}
    </span>
  );
}

/** Conviction bar — horizontal fill */
function ConvictionBar({ normalized }) {
  const { pct, color } = fmtConvBar(normalized);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{
        flex: 1,
        height: "4px",
        background: C.bgPanel,
        borderRadius: "2px",
        overflow: "hidden",
      }}>
        <div style={{
          width: pct + "%",
          height: "100%",
          background: color,
          borderRadius: "2px",
          transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontSize: "0.7rem", color, fontWeight: 700, minWidth: "3rem", textAlign: "right" }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

/** Section header — matches RiskCentre V10 section heads */
function SectionHead({ label, sub, accent = C.moonshot, count }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "baseline",
      gap: "0.75rem",
      marginBottom: "0.85rem",
    }}>
      <div style={{
        width: "3px",
        height: "1.1rem",
        background: accent,
        borderRadius: "2px",
        flexShrink: 0,
        alignSelf: "center",
      }} />
      <span style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: accent,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {label}
      </span>
      {sub && (
        <span style={{ fontSize: "0.65rem", color: C.textMuted, letterSpacing: "0.05em" }}>
          {sub}
        </span>
      )}
      {count !== undefined && (
        <span style={{
          marginLeft: "auto",
          fontSize: "0.65rem",
          color: C.textMuted,
          background: C.bgPanel,
          padding: "0.1rem 0.45rem",
          borderRadius: "4px",
          border: `1px solid ${C.border}`,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

/** Factor attribution row — signed numeric, coloured delta */
function FactorRow({ label, value }) {
  const v = Number(value ?? 0);
  const color = v > 0.1 ? C.green : v < -0.1 ? C.red : C.textDim;
  const sign = v > 0 ? "+" : "";
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.25rem 0",
      borderBottom: `1px solid ${C.borderFaint}`,
    }}>
      <span style={{ fontSize: "0.72rem", color: C.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>
        {sign}{v.toFixed(3)}
      </span>
    </div>
  );
}

/** Numbered explanation row — mirrors RiskCentre V10 numbered rows */
function ExplRow({ index, text, accent = C.moonshot }) {
  return (
    <div style={{
      display: "flex",
      gap: "0.6rem",
      padding: "0.4rem 0",
      borderBottom: `1px solid ${C.borderFaint}`,
    }}>
      <span style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        color: accent,
        minWidth: "1.4rem",
        fontFamily: "'IBM Plex Mono', monospace",
        paddingTop: "0.05rem",
      }}>
        {String(index).padStart(2, "0")}
      </span>
      <span style={{ fontSize: "0.75rem", color: C.textDim, lineHeight: 1.55 }}>
        {text}
      </span>
    </div>
  );
}

/** Telemetry stat cell */
function TelStat({ label, value, color = C.textDim }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.2rem",
      padding: "0.6rem 0.75rem",
      background: C.bgPanel,
      borderRadius: "6px",
      border: `1px solid ${C.border}`,
      minWidth: "5rem",
    }}>
      <span style={{ fontSize: "1rem", fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </span>
      <span style={{ fontSize: "0.6rem", color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOONSHOT CARD — primary surfaced candidate
// ─────────────────────────────────────────────
function MoonshotCard({ r, index, isSelected, onSelect }) {
  const sym = getSymbol(r);
  const dec = r?.decision?.decision || "NONE";
  const decStyle = decisionColour(dec);
  const tier = convictionTier(r?.conviction?.normalized);
  const traj = r?.trajectoryMatch || {};
  const trajConf = Number(traj.confidence ?? 0);
  const trajLabel = trajectoryConfidenceLabel(trajConf);
  const factors = r?.factorAttribution || {};
  const factorEntries = Object.entries(factors);

  // parse explanation — may be string or object with plainEnglishSummary
  const explanationText = typeof r?.explanation === "string"
    ? r.explanation
    : r?.explanation?.plainEnglishSummary || "";

  // split into sentences for numbered rows
  const explanationSentences = explanationText
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 6);

  const regime = r?.regime || {};
  const fundamentalsAudit = r?.fundamentalsAudit?.categories || null;

  // trajectory signal strength ring colour
  const trajRingColor = trajConf >= 0.75 ? C.green : trajConf >= 0.5 ? C.amber : C.moonshot;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? C.moonshotBg : C.bgCard,
        border: `1px solid ${isSelected ? C.moonshot + "66" : C.border}`,
        borderRadius: "10px",
        padding: "1.1rem",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Trajectory glow line at top */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: `linear-gradient(90deg, ${trajRingColor}00, ${trajRingColor}, ${trajRingColor}00)`,
        opacity: isSelected ? 1 : 0.5,
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.7rem" }}>
        <span style={{
          fontSize: "0.65rem",
          color: C.moonshot,
          fontWeight: 700,
          fontFamily: "'IBM Plex Mono', monospace",
          minWidth: "1.5rem",
        }}>
          #{index + 1}
        </span>
        <span style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: C.text,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.05em",
        }}>
          {sym}
        </span>
        <Chip label={dec} color={decStyle.color} bg={decStyle.bg} />
        <Chip label={tier.label + " CONV"} color={tier.color} bg={tier.bg} size="xs" />
        {traj.available && (
          <Chip label={"\u25b2 TRAJECTORY"} color={C.moonshot} bg={C.moonshotBg} size="xs" />
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: C.textMuted }}>
          {regime.label || ""}
        </span>
      </div>

      {/* Conviction bar */}
      <ConvictionBar normalized={r?.conviction?.normalized} />

      {/* Trajectory signal block */}
      {traj.available && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.6rem 0.75rem",
          background: C.bgPanel,
          borderRadius: "6px",
          border: `1px solid ${C.moonshot}33`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.moonshot, letterSpacing: "0.08em" }}>
              TRAJECTORY SIGNAL
            </span>
            <span style={{ fontSize: "0.65rem", color: trajRingColor, fontWeight: 700 }}>
              {trajLabel} \u2014 {fmtPct(traj.confidence)}
            </span>
          </div>
          {traj.label && (
            <div style={{ fontSize: "0.72rem", color: C.textDim, marginBottom: "0.2rem", fontWeight: 600 }}>
              {traj.label}
            </div>
          )}
          {traj.explanation && (
            <div style={{ fontSize: "0.7rem", color: C.textMuted, lineHeight: 1.5 }}>
              {traj.explanation}
            </div>
          )}
        </div>
      )}

      {/* Driver chips row */}
      {factorEntries.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.65rem" }}>
          {factorEntries.slice(0, 6).map(([k, v]) => {
            const val = Number(v ?? 0);
            const chipColor = val > 0.05 ? C.green : val < -0.05 ? C.red : C.textMuted;
            const chipBg   = val > 0.05 ? C.greenDim : val < -0.05 ? C.redDim : C.bgPanel;
            const sign = val > 0 ? "+" : "";
            return (
              <Chip
                key={k}
                label={`${k} ${sign}${val.toFixed(2)}`}
                color={chipColor}
                bg={chipBg}
                size="xs"
              />
            );
          })}
        </div>
      )}

      {/* Numbered explanation rows */}
      {explanationSentences.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          {explanationSentences.slice(0, 4).map((s, i) => (
            <ExplRow key={i} index={i + 1} text={s} accent={C.moonshot} />
          ))}
        </div>
      )}

      {/* Regime context line */}
      {regime.assumption && (
        <div style={{
          marginTop: "0.65rem",
          fontSize: "0.67rem",
          color: C.textMuted,
          fontStyle: "italic",
          lineHeight: 1.4,
          paddingLeft: "0.5rem",
          borderLeft: `2px solid ${C.border}`,
        }}>
          Regime assumption: {regime.assumption}
        </div>
      )}

      {/* Fundamentals audit chips */}
      {fundamentalsAudit && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.65rem" }}>
          {Object.entries(fundamentalsAudit).map(([k, v]) => {
            const s = v?.status || "UNKNOWN";
            const statusColor = s === "PASS" ? C.green : s === "WARN" ? C.amber : s === "FAIL" ? C.red : C.textMuted;
            const statusBg    = s === "PASS" ? C.greenDim : s === "WARN" ? C.amberDim : s === "FAIL" ? C.redDim : C.bgPanel;
            return (
              <Chip key={k} label={`${k}: ${s}`} color={statusColor} bg={statusBg} size="xs" />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// NEAR-ORBIT CARD — preview zone, human review required
// ─────────────────────────────────────────────
function NearOrbitCard({ r }) {
  const sym = getSymbol(r);
  const dec = r?.decision?.decision || "NONE";
  const decStyle = decisionColour(dec);
  const traj = r?.trajectoryMatch || {};

  return (
    <div style={{
      background: C.orbitBg,
      border: `1px solid ${C.orbit}44`,
      borderRadius: "8px",
      padding: "0.8rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${C.orbit}88, transparent)`,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
          {sym}
        </span>
        <Chip label={dec} color={decStyle.color} bg={decStyle.bg} size="xs" />
        {traj.available && (
          <Chip label={"\u25b2 TRAJ"} color={C.orbit} bg={C.purpleDim} size="xs" />
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: C.textMuted }}>
          {fmtPct(r?.conviction?.normalized)} conviction
        </span>
      </div>
      <ConvictionBar normalized={r?.conviction?.normalized} />
      <div style={{
        marginTop: "0.5rem",
        fontSize: "0.67rem",
        color: C.orbit,
        background: C.bgPanel,
        padding: "0.3rem 0.5rem",
        borderRadius: "4px",
        border: `1px solid ${C.orbit}33`,
      }}>
        \u26a0 {r?.previewReason || "Near-miss: human review only"}
      </div>
      {traj.available && traj.label && (
        <div style={{ fontSize: "0.68rem", color: C.textMuted, marginTop: "0.4rem" }}>
          {traj.label}
          {traj.confidence ? ` \u2014 ${fmtPct(traj.confidence)}` : ""}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DETAIL PANEL — right column, selected candidate deep dive
// ─────────────────────────────────────────────
function DetailPanel({ r }) {
  if (!r) {
    return (
      <div style={{ padding: "1.5rem", color: C.textMuted, fontSize: "0.75rem", textAlign: "center", marginTop: "3rem" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem", opacity: 0.3 }}>&#9685;</div>
        Select a candidate to view deep analysis
      </div>
    );
  }

  const sym = getSymbol(r);
  const dec = r?.decision?.decision || "NONE";
  const decStyle = decisionColour(dec);
  const tier = convictionTier(r?.conviction?.normalized);
  const factors = r?.factorAttribution || {};
  const traj = r?.trajectoryMatch || {};
  const regime = r?.regime || {};
  const fundamentalsAudit = r?.fundamentalsAudit?.categories || null;

  const explanationText = typeof r?.explanation === "string"
    ? r.explanation
    : r?.explanation?.plainEnglishSummary || "";
  const explanationSentences = explanationText
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 6);

  return (
    <div style={{ padding: "0.25rem" }}>
      {/* Symbol header */}
      <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <span style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: C.text,
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.06em",
          }}>
            {sym}
          </span>
          <Chip label={dec} color={decStyle.color} bg={decStyle.bg} />
        </div>
        <ConvictionBar normalized={r?.conviction?.normalized} />
        <div style={{ marginTop: "0.3rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <Chip label={tier.label + " CONVICTION"} color={tier.color} bg={tier.bg} size="xs" />
          {regime.label && <Chip label={regime.label} color={C.blue} bg={C.blueDim} size="xs" />}
        </div>
      </div>

      {/* Trajectory deep dive */}
      {traj.available && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionHead
            label="Trajectory Signal"
            accent={C.moonshot}
          />
          <div style={{
            background: C.moonshotBg,
            border: `1px solid ${C.moonshot}44`,
            borderRadius: "8px",
            padding: "0.75rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.72rem", color: C.moonshot, fontWeight: 700 }}>
                {traj.label || "Pattern Detected"}
              </span>
              <span style={{ fontSize: "0.7rem", color: C.text, fontWeight: 700 }}>
                {trajectoryConfidenceLabel(traj.confidence)} ({fmtPct(traj.confidence)})
              </span>
            </div>
            {traj.explanation && (
              <p style={{ fontSize: "0.72rem", color: C.textDim, margin: 0, lineHeight: 1.55 }}>
                {traj.explanation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Regime context */}
      {(regime.label || regime.assumption) && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionHead label="Regime Context" accent={C.blue} />
          <div style={{ fontSize: "0.72rem", color: C.textDim, lineHeight: 1.55 }}>
            {regime.label && (
              <div style={{ fontWeight: 600, color: C.text, marginBottom: "0.2rem" }}>{regime.label}</div>
            )}
            {regime.assumption && (
              <div style={{ fontStyle: "italic", opacity: 0.8 }}>{regime.assumption}</div>
            )}
          </div>
        </div>
      )}

      {/* Engine explanation — numbered */}
      {explanationSentences.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionHead label="Engine Explanation" sub="read-only output" accent={C.textDim} />
          <div>
            {explanationSentences.map((s, i) => (
              <ExplRow key={i} index={i + 1} text={s} accent={C.moonshot} />
            ))}
          </div>
        </div>
      )}

      {/* Factor attribution */}
      {Object.keys(factors).length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionHead label="Factor Attribution" accent={C.cyan} />
          <div>
            {Object.entries(factors).map(([k, v]) => (
              <FactorRow key={k} label={k} value={v} />
            ))}
          </div>
        </div>
      )}

      {/* Fundamentals audit */}
      {fundamentalsAudit && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionHead label="Fundamentals Audit" accent={C.teal} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {Object.entries(fundamentalsAudit).map(([k, v]) => {
              const s = v?.status || "UNKNOWN";
              const statusColor = s === "PASS" ? C.green : s === "WARN" ? C.amber : s === "FAIL" ? C.red : C.textMuted;
              const statusBg    = s === "PASS" ? C.greenDim : s === "WARN" ? C.amberDim : s === "FAIL" ? C.redDim : C.bgPanel;
              return (
                <div key={k} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.25rem 0",
                  borderBottom: `1px solid ${C.borderFaint}`,
                }}>
                  <span style={{ fontSize: "0.72rem", color: C.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {k}
                  </span>
                  <Chip label={s} color={statusColor} bg={statusBg} size="xs" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engine guarantee */}
      <div style={{
        marginTop: "1rem",
        padding: "0.6rem 0.75rem",
        background: C.bgPanel,
        borderRadius: "6px",
        border: `1px solid ${C.border}`,
        fontSize: "0.62rem",
        color: C.textMuted,
        lineHeight: 1.5,
        fontStyle: "italic",
      }}>
        Discovery outputs are mathematical classifications only. No actions are executed. Read-only.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TELEMETRY FOOTER — engine guarantees block
// ─────────────────────────────────────────────
function TelemetryFooter({ telemetry, gatingNote }) {
  if (!telemetry) return null;

  const notes = telemetry.notes || [];
  const gating = telemetry.gating || {};

  return (
    <div style={{
      marginTop: "2rem",
      padding: "1rem",
      background: C.bgPanel,
      borderRadius: "10px",
      border: `1px solid ${C.border}`,
    }}>
      <SectionHead label="Engine Telemetry" sub="scan integrity" accent={C.textMuted} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
        <TelStat label="Universe"  value={telemetry.universeNormalizedCount ?? "\u2014"} />
        <TelStat label="Evaluated" value={telemetry.evaluatedCount ?? "\u2014"} />
        <TelStat label="Ranked"    value={telemetry.rankedCount ?? "\u2014"} />
        <TelStat label="Surfaced"  value={telemetry.surfacedCount ?? "\u2014"} color={C.green} />
        <TelStat label="Preview"   value={telemetry.previewCount ?? "\u2014"} color={C.amber} />
        <TelStat label="Rejected"  value={telemetry.rejectedCount ?? "\u2014"} color={C.red} />
      </div>

      {/* Gating note */}
      {gating.surfacing && (
        <div style={{ fontSize: "0.67rem", color: C.textMuted, marginBottom: "0.5rem", fontFamily: "'IBM Plex Mono', monospace" }}>
          Surfacing gate: conviction \u2265 {(gating.surfacing.minConviction * 100).toFixed(0)}%
          {gating.surfacing.blockedByAVOID > 0
            ? ` \u2014 ${gating.surfacing.blockedByAVOID} blocked by AVOID`
            : ""}
        </div>
      )}

      {/* Engine notes */}
      {notes.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          {notes.map((n, i) => (
            <div key={i} style={{
              fontSize: "0.67rem",
              color: C.amber,
              padding: "0.25rem 0",
              borderTop: `1px solid ${C.borderFaint}`,
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              \u26a0 {n}
            </div>
          ))}
        </div>
      )}

      {/* Governance note */}
      <div style={{
        marginTop: "0.75rem",
        paddingTop: "0.6rem",
        borderTop: `1px solid ${C.border}`,
        fontSize: "0.62rem",
        color: C.textMuted,
        fontStyle: "italic",
        lineHeight: 1.5,
      }}>
        MoonshotLab is read-only. All outputs are mathematical classifications produced by the main-process
        discovery engine. No execution, no mutation, no silent loosening of gates.
        Append-only. Pre-breakout signals require human review before any action.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({ reason }) {
  return (
    <div style={{
      padding: "2.5rem",
      textAlign: "center",
      background: C.bgCard,
      borderRadius: "10px",
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.2 }}>&#9685;</div>
      <div style={{ fontSize: "0.8rem", color: C.textMuted, lineHeight: 1.6 }}>
        {reason || "No moonshot candidates identified in this scan cycle."}
      </div>
      <div style={{ fontSize: "0.67rem", color: C.textMuted, marginTop: "0.75rem", fontStyle: "italic" }}>
        Candidates require: trajectoryMatch.available = true \u2014 decision BUY or BUY_MORE \u2014 conviction \u2265 {(CONVICTION.SURFACE_MIN * 100).toFixed(0)}%
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function MoonshotLab() {
  const [scanResult,   setScanResult]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selectedSym,  setSelectedSym]  = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  // ---- IPC LOAD ----
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await window.jupiter.invoke("discovery:run");
        if (!mounted) return;
        setScanResult(result || null);
        setLastRefresh(new Date());
      } catch (err) {
        console.error("MoonshotLab: discovery:run failed", err);
        if (mounted) setError("Engine scan unavailable. Check main-process logs.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // ---- MOONSHOT FILTER ----
  // Canonical = already conviction-gated by runDiscoveryScan (>= 0.45, not AVOID)
  // Moonshots = canonical where trajectoryMatch.available === true AND BUY/BUY_MORE
  const moonshots = useMemo(() => {
    const canonical = Array.isArray(scanResult?.canonical) ? scanResult.canonical : [];
    return canonical.filter(r => {
      const dec = r?.decision?.decision;
      const traj = r?.trajectoryMatch?.available === true;
      return traj && (dec === "BUY" || dec === "BUY_MORE");
    });
  }, [scanResult]);

  // Surfaced without trajectory signal
  const surfacedNoTraj = useMemo(() => {
    const canonical = Array.isArray(scanResult?.canonical) ? scanResult.canonical : [];
    return canonical.filter(r => {
      const traj = r?.trajectoryMatch?.available === true;
      const dec = r?.decision?.decision;
      // exclude moonshots already shown above; include everything else surfaced
      return !(traj && (dec === "BUY" || dec === "BUY_MORE"));
    });
  }, [scanResult]);

  // Near-orbit = preview items that have trajectory signal
  const nearOrbit = useMemo(() => {
    const preview = Array.isArray(scanResult?.preview) ? scanResult.preview : [];
    return preview.filter(r => r?.trajectoryMatch?.available === true);
  }, [scanResult]);

  // Near-orbit without trajectory (all remaining preview)
  const previewNoTraj = useMemo(() => {
    const preview = Array.isArray(scanResult?.preview) ? scanResult.preview : [];
    return preview.filter(r => r?.trajectoryMatch?.available !== true);
  }, [scanResult]);

  // Selected candidate (from moonshots or surfacedNoTraj)
  const selectedCandidate = useMemo(() => {
    if (!selectedSym) return null;
    const canonical = Array.isArray(scanResult?.canonical) ? scanResult.canonical : [];
    return canonical.find(r => getSymbol(r) === selectedSym) || null;
  }, [selectedSym, scanResult]);

  const handleSelect = useCallback((r) => {
    const sym = getSymbol(r);
    setSelectedSym(prev => prev === sym ? null : sym);
  }, []);

  const telemetry = scanResult?.telemetry || null;

  // ---- POSTURE CLASSIFICATION ----
  // "Moonshot Density" posture: what fraction of surfaced candidates have trajectory signal
  const postureLabel = useMemo(() => {
    const total = moonshots.length + surfacedNoTraj.length;
    if (total === 0) return { label: "NO SIGNAL", color: C.textMuted, bg: C.bgPanel };
    const ratio = moonshots.length / total;
    if (ratio >= 0.67) return { label: "HIGH DENSITY",    color: C.green,   bg: C.greenDim };
    if (ratio >= 0.34) return { label: "MIXED SIGNAL",    color: C.amber,   bg: C.amberDim };
    if (moonshots.length > 0) return { label: "SPARSE SIGNAL", color: C.moonshot, bg: C.moonshotBg };
    return { label: "NO TRAJECTORY", color: C.textMuted, bg: C.bgPanel };
  }, [moonshots, surfacedNoTraj]);

  // ──────────────────────────────────────────
  // RENDER: LOADING
  // ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: C.bg,
        fontFamily: "'IBM Plex Mono', monospace",
        color: C.textMuted,
        fontSize: "0.8rem",
        gap: "0.75rem",
      }}>
        <span style={{ color: C.moonshot, animation: "none" }}>&#9685;</span>
        Running discovery scan\u2026
      </div>
    );
  }

  // ──────────────────────────────────────────
  // RENDER: ERROR
  // ──────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: C.bg,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <div style={{
          background: C.bgCard,
          border: `1px solid ${C.red}44`,
          borderRadius: "10px",
          padding: "1.5rem 2rem",
          textAlign: "center",
        }}>
          <div style={{ color: C.red, fontWeight: 700, marginBottom: "0.4rem" }}>SCAN FAILURE</div>
          <div style={{ color: C.textMuted, fontSize: "0.75rem" }}>{error}</div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // RENDER: MAIN
  // ──────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      height: "100%",
      background: C.bg,
      fontFamily: "'IBM Plex Mono', monospace",
      color: C.text,
      overflow: "hidden",
    }}>

      {/* ════════════════════════════════════════
          LEFT COLUMN — main surface
      ════════════════════════════════════════ */}
      <div style={{
        flex: 3,
        overflowY: "auto",
        padding: "1.75rem",
        borderRight: `1px solid ${C.border}`,
        maxWidth: 900,
      }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.35rem" }}>
            <h1 style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.text,
            }}>
              Moonshot Lab
            </h1>
            <Chip label={postureLabel.label} color={postureLabel.color} bg={postureLabel.bg} />
            {lastRefresh && (
              <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: C.textMuted }}>
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p style={{
            margin: 0,
            fontSize: "0.72rem",
            color: C.textMuted,
            lineHeight: 1.5,
          }}>
            Pre-breakout intelligence surface \u2014 read-only \u2014 main-process discovery engine
          </p>

          {/* Posture bar */}
          <div style={{
            marginTop: "0.75rem",
            padding: "0.7rem 0.9rem",
            background: C.bgCard,
            borderRadius: "8px",
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.62rem", color: C.textMuted, letterSpacing: "0.08em" }}>
                MOONSHOTS
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: C.moonshot }}>
                {moonshots.length}
              </span>
            </div>
            <div style={{ width: "1px", height: "1.2rem", background: C.border }} />
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.62rem", color: C.textMuted, letterSpacing: "0.08em" }}>
                NEAR ORBIT
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: C.orbit }}>
                {nearOrbit.length}
              </span>
            </div>
            <div style={{ width: "1px", height: "1.2rem", background: C.border }} />
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.62rem", color: C.textMuted, letterSpacing: "0.08em" }}>
                SURFACED / NO TRAJ
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: C.textDim }}>
                {surfacedNoTraj.length}
              </span>
            </div>
            <div style={{ width: "1px", height: "1.2rem", background: C.border }} />
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.62rem", color: C.textMuted, letterSpacing: "0.08em" }}>
                REJECTED
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: C.red }}>
                {telemetry?.rejectedCount ?? "\u2014"}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: MOONSHOT CANDIDATES ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <SectionHead
            label="Moonshot Candidates"
            sub="trajectoryMatch.available = true \u2014 BUY / BUY_MORE \u2014 conviction \u2265 45%"
            accent={C.moonshot}
            count={moonshots.length}
          />

          {moonshots.length === 0 ? (
            <EmptyState reason="No candidates passed the trajectory + conviction + BUY/BUY_MORE gate in this scan cycle." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {moonshots.map((r, i) => (
                <MoonshotCard
                  key={getSymbol(r)}
                  r={r}
                  index={i}
                  isSelected={selectedSym === getSymbol(r)}
                  onSelect={() => handleSelect(r)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 2: NEAR ORBIT ── */}
        {nearOrbit.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <SectionHead
              label="Near Orbit"
              sub="trajectory signal detected \u2014 conviction below surfacing gate \u2014 human review only"
              accent={C.orbit}
              count={nearOrbit.length}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {nearOrbit.map(r => (
                <NearOrbitCard key={getSymbol(r)} r={r} />
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 3: SURFACED / NO TRAJECTORY ── */}
        {surfacedNoTraj.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <SectionHead
              label="Surfaced \u2014 No Trajectory Signal"
              sub="passed conviction gate \u2014 no pre-breakout pattern detected"
              accent={C.textDim}
              count={surfacedNoTraj.length}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {surfacedNoTraj.map((r, i) => (
                <MoonshotCard
                  key={getSymbol(r)}
                  r={r}
                  index={i}
                  isSelected={selectedSym === getSymbol(r)}
                  onSelect={() => handleSelect(r)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 4: PREVIEW / NO TRAJECTORY ── */}
        {previewNoTraj.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <SectionHead
              label="Preview Zone"
              sub="below surfacing gate \u2014 no trajectory signal \u2014 observational only"
              accent={C.textMuted}
              count={previewNoTraj.length}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {previewNoTraj.map(r => (
                <div key={getSymbol(r)} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.55rem 0.75rem",
                  background: C.bgCard,
                  borderRadius: "6px",
                  border: `1px solid ${C.border}`,
                  fontSize: "0.72rem",
                }}>
                  <span style={{ fontWeight: 700, color: C.text, minWidth: "4rem", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {getSymbol(r)}
                  </span>
                  <Chip
                    label={r?.decision?.decision || "NONE"}
                    color={decisionColour(r?.decision?.decision).color}
                    bg={decisionColour(r?.decision?.decision).bg}
                    size="xs"
                  />
                  <span style={{ color: C.textMuted }}>{fmtPct(r?.conviction?.normalized)}</span>
                  <span style={{ color: C.textMuted, fontSize: "0.65rem", marginLeft: "auto" }}>
                    {r?.previewReason || "Near-miss"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TELEMETRY FOOTER ── */}
        <TelemetryFooter telemetry={telemetry} />

      </div>

      {/* ════════════════════════════════════════
          RIGHT COLUMN — detail panel
      ════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.75rem 1.25rem",
        background: C.bgDeep,
        minWidth: 260,
        maxWidth: 340,
      }}>
        <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.textMuted }}>
            Deep Analysis
          </div>
        </div>
        <DetailPanel r={selectedCandidate} />
      </div>

    </div>
  );
}
