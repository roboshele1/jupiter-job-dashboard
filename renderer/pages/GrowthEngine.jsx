import { useState, useEffect, useCallback } from "react";
import { CAGR, getCAGR } from "../constants/cagrAssumptions.js";

// ─── colour tokens (project-wide pattern) ────────────────────────────────────
const C = {
  bg:        "#060910",
  surface:   "#0c1220",
  surface2:  "#111827",
  border:    "#1e2d45",
  borderHi:  "#2a3f5f",
  accent:    "#3b82f6",
  accentDim: "#1d4ed8",
  green:     "#22c55e",
  greenDim:  "#166534",
  yellow:    "#eab308",
  yellowDim: "#713f12",
  red:       "#ef4444",
  redDim:    "#7f1d1d",
  text:      "#e2e8f0",
  textMuted: "#64748b",
  textDim:   "#94a3b8",
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt$ = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}k`
    : `$${n.toFixed(0)}`;

const fmtPct = (n, decimals = 1) => `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;

// project value at end of year using compound growth
const projectValue = (start, monthly, years, annualRate) => {
  const r = annualRate / 12;
  const months = years * 12;
  const lumpGrowth = start * Math.pow(1 + r, months);
  const contribGrowth = monthly * ((Math.pow(1 + r, months) - 1) / r);
  return lumpGrowth + contribGrowth;
};

// ─── sub-components ──────────────────────────────────────────────────────────

/** Single year milestone row */
const MilestoneRow = ({ year, value, goal }) => {
  const pct = Math.min((value / goal) * 100, 100);
  const reached = value >= goal;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <span style={{ fontFamily: "IBM Plex Mono", fontSize: 12, color: C.textMuted, width: 50 }}>
        {year}
      </span>
      <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: reached ? C.green : C.accent,
            borderRadius: 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 12,
          color: reached ? C.green : C.text,
          width: 90,
          textAlign: "right",
          fontWeight: reached ? 700 : 400,
        }}
      >
        {fmt$(value)}
      </span>
      {reached && (
        <span style={{ fontSize: 11, color: C.green, fontFamily: "IBM Plex Mono" }}>✓ GOAL</span>
      )}
    </div>
  );
};

/** Kelly allocation card for a single ticker */
const AllocationCard = ({ ticker, dollarAmount, kellyWeight, currentPct, kellyPct }) => {
  const drift = kellyPct - currentPct;
  const driftColor = drift > 2 ? C.green : drift < -2 ? C.red : C.yellow;
  const driftLabel = drift > 2 ? "UNDERWEIGHT" : drift < -2 ? "OVERWEIGHT" : "NEAR TARGET";

  return (
    <div
      style={{
        background: C.surface2,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHi)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
    >
      {/* ticker badge */}
      <div
        style={{
          width: 52,
          height: 52,
          background: C.surface,
          border: `1px solid ${C.borderHi}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "IBM Plex Mono",
            fontSize: ticker.length > 4 ? 9 : 11,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "0.05em",
          }}
        >
          {ticker}
        </span>
      </div>

      {/* dollar allocation — primary info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 20,
              fontWeight: 700,
              color: C.green,
              letterSpacing: "-0.02em",
            }}
          >
            {fmt$(dollarAmount)}
          </span>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: C.textMuted }}>
            {(kellyWeight * 100).toFixed(1)}% of contrib
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: C.textMuted }}>
            current&nbsp;
            <span style={{ color: C.textDim }}>{currentPct.toFixed(1)}%</span>
          </span>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: C.textMuted }}>
            kelly target&nbsp;
            <span style={{ color: C.accent }}>{kellyPct.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* drift badge */}
      <div
        style={{
          padding: "4px 10px",
          background: `${driftColor}18`,
          border: `1px solid ${driftColor}44`,
          borderRadius: 6,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 700, color: driftColor }}>
          {fmtPct(drift)}
        </div>
        <div style={{ fontFamily: "IBM Plex Mono", fontSize: 9, color: `${driftColor}cc`, marginTop: 2 }}>
          {driftLabel}
        </div>
      </div>
    </div>
  );
};

// ─── loading / error skeletons ────────────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 16, radius = 4 }) => (
  <div
    style={{
      width: w,
      height: h,
      background: C.surface2,
      borderRadius: radius,
      animation: "pulse 1.5s ease-in-out infinite",
    }}
  />
);

// ─── main component ───────────────────────────────────────────────────────────
export default function GrowthEngine() {
  // ── form state ────────────────────────────────────────────────────────────
  const [startValue, setStartValue]   = useState(100_000);
  const [monthly, setMonthly]         = useState(500);
  const [targetYear, setTargetYear]   = useState(2037);
  const [blendedRate, setBlendedRate] = useState(0.22); // 22% default

  // ── kelly data ────────────────────────────────────────────────────────────
  const [kellyData, setKellyData]   = useState(null);
  const [kellyError, setKellyError] = useState(null);
  const [kellyLoading, setKellyLoading] = useState(true);

  // ── portfolio snapshot (for current allocation %) ─────────────────────────
  const [portfolioValue, setPortfolioValue] = useState(null);

  const loadKelly = useCallback(async () => {
    setKellyLoading(true);
    setKellyError(null);
    try {
      const result = await window.jupiter.invoke("decisions:getKellyRecommendations");
      setKellyData(result);
      if (result?.portfolioValue) setPortfolioValue(result.portfolioValue);
    } catch (err) {
      setKellyError(err?.message ?? "Failed to load Kelly recommendations");
    } finally {
      setKellyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKelly();
  }, [loadKelly]);

  // ── projection maths ──────────────────────────────────────────────────────
  const startYear = new Date().getFullYear();
  const years     = targetYear - startYear;
  const goal      = 1_000_000;

  const milestones = Array.from({ length: years }, (_, i) => {
    const y = startYear + i + 1;
    return { year: y, value: projectValue(startValue, monthly, i + 1, blendedRate) };
  });

  const finalValue      = milestones[milestones.length - 1]?.value ?? 0;
  const goalYear        = milestones.find((m) => m.value >= goal)?.year ?? null;
  const yearsToGoal     = goalYear ? goalYear - startYear : null;
  const shortfall       = Math.max(goal - finalValue, 0);
  const isOnTrack       = finalValue >= goal;

  // ── allocation maths ──────────────────────────────────────────────────────
  // Filter to BUY / BUY_MORE only, sort by Kelly weight descending
  const buyActions = (kellyData?.actions ?? [])
    .filter((a) => a.action === "BUY" || a.action === "BUY_MORE")
    .sort((a, b) => (b.kellyWeight ?? 0) - (a.kellyWeight ?? 0));

  const totalKellyWeight = buyActions.reduce((s, a) => s + (a.kellyWeight ?? 0), 0);

  // Re-normalise among buyable actions so weights sum to 1
  const allocations = buyActions.map((a) => {
    const normalisedWeight = totalKellyWeight > 0 ? (a.kellyWeight ?? 0) / totalKellyWeight : 0;
    const dollarAmount     = monthly * normalisedWeight;
    const pV               = portfolioValue ?? kellyData?.portfolioValue ?? startValue;
    const currentPct       = pV > 0 ? ((a.currentValue ?? 0) / pV) * 100 : 0;
    const kellyPct         = (a.kellyWeight ?? 0) * 100; // raw Kelly % of total portfolio

    return {
      ticker:         a.ticker,
      dollarAmount,
      kellyWeight:    normalisedWeight,
      currentPct,
      kellyPct,
    };
  });

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "IBM Plex Mono, monospace",
        padding: "32px 40px",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* ── header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 6,
              height: 28,
              background: `linear-gradient(180deg, ${C.accent}, ${C.green})`,
              borderRadius: 3,
            }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            GROWTH ENGINE
          </h1>
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, paddingLeft: 16 }}>
          Compound projection · Kelly-optimal contribution allocation · $100k → $1M
        </p>
      </div>

      {/* ── inputs ── */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "24px 28px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 20, letterSpacing: "0.08em" }}>
          PROJECTION PARAMETERS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            {
              label: "Starting Value",
              value: startValue,
              set: (v) => setStartValue(Number(v)),
              prefix: "$",
              step: 1000,
              min: 0,
            },
            {
              label: "Monthly Contribution",
              value: monthly,
              set: (v) => setMonthly(Number(v)),
              prefix: "$",
              step: 100,
              min: 0,
            },
            {
              label: "Target Year",
              value: targetYear,
              set: (v) => setTargetYear(Number(v)),
              prefix: "",
              step: 1,
              min: startYear + 1,
            },
            {
              label: "Blended CAGR %",
              value: (blendedRate * 100).toFixed(0),
              set: (v) => setBlendedRate(Number(v) / 100),
              prefix: "",
              step: 1,
              min: 1,
              max: 80,
            },
          ].map(({ label, value, set, prefix, step, min, max }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 6, letterSpacing: "0.06em" }}>
                {label}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "0 10px",
                  gap: 4,
                }}
              >
                {prefix && (
                  <span style={{ fontSize: 13, color: C.textMuted }}>{prefix}</span>
                )}
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  step={step}
                  min={min}
                  max={max}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: C.text,
                    fontFamily: "IBM Plex Mono",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "10px 0",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── projection summary banner ── */}
      <div
        style={{
          background: isOnTrack
            ? `linear-gradient(135deg, ${C.greenDim}44, ${C.surface})`
            : `linear-gradient(135deg, ${C.yellowDim}44, ${C.surface})`,
          border: `1px solid ${isOnTrack ? C.green : C.yellow}44`,
          borderRadius: 12,
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, letterSpacing: "0.08em" }}>
            PROJECTED VALUE BY {targetYear}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: isOnTrack ? C.green : C.yellow }}>
            {fmt$(finalValue)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {isOnTrack ? (
            <>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>GOAL REACHED</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{goalYear}</div>
              <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>
                {yearsToGoal} year{yearsToGoal !== 1 ? "s" : ""} to $1M
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>SHORTFALL</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.yellow }}>{fmt$(shortfall)}</div>
              <div style={{ fontSize: 11, color: C.yellow, marginTop: 2 }}>below $1M target</div>
            </>
          )}
        </div>
      </div>

      {/* ── milestone chart ── */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "24px 28px",
          marginBottom: 36,
        }}
      >
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16, letterSpacing: "0.08em" }}>
          YEAR-BY-YEAR PROJECTION
        </div>
        {milestones.map((m) => (
          <MilestoneRow key={m.year} year={m.year} value={m.value} goal={goal} />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ALLOCATION RECOMMENDATION — NEW SECTION
          ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.borderHi}`,
          borderRadius: 12,
          padding: "28px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* subtle accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${C.accent}, ${C.green})`,
          }}
        />

        {/* section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: `${C.accent}22`,
                  border: `1px solid ${C.accent}55`,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: C.accent,
                  fontWeight: 700,
                }}
              >
                ⚡
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em" }}>
                ALLOCATION RECOMMENDATION
              </span>
            </div>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, paddingLeft: 28 }}>
              Kelly-optimal split of your{" "}
              <span style={{ color: C.green, fontWeight: 700 }}>{fmt$(monthly)}/month</span>{" "}
              contribution across BUY / BUY_MORE positions · corrects portfolio drift
            </p>
          </div>
          <button
            onClick={loadKelly}
            disabled={kellyLoading}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: kellyLoading ? C.textMuted : C.textDim,
              fontFamily: "IBM Plex Mono",
              fontSize: 11,
              padding: "6px 14px",
              cursor: kellyLoading ? "not-allowed" : "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!kellyLoading) {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.color = C.accent;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.textDim;
            }}
          >
            {kellyLoading ? "LOADING…" : "↺ REFRESH"}
          </button>
        </div>

        <div
          style={{
            height: 1,
            background: C.border,
            margin: "20px 0",
          }}
        />

        {/* loading state */}
        {kellyLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "18px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: 1 - i * 0.15,
                }}
              >
                <Skeleton w={52} h={52} radius={8} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton w="40%" h={20} />
                  <Skeleton w="60%" h={12} />
                </div>
                <Skeleton w={80} h={40} radius={6} />
              </div>
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }`}</style>
          </div>
        )}

        {/* error state */}
        {!kellyLoading && kellyError && (
          <div
            style={{
              background: `${C.red}14`,
              border: `1px solid ${C.red}44`,
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>⚠</span>
            <div>
              <div style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>KELLY DATA UNAVAILABLE</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{kellyError}</div>
            </div>
          </div>
        )}

        {/* empty — no buyable actions */}
        {!kellyLoading && !kellyError && allocations.length === 0 && (
          <div
            style={{
              background: `${C.yellow}10`,
              border: `1px solid ${C.yellow}33`,
              borderRadius: 8,
              padding: "20px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>—</div>
            <div style={{ fontSize: 12, color: C.yellow, fontWeight: 700 }}>
              NO BUY / BUY_MORE SIGNALS ACTIVE
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
              Kelly engine has no conviction positions right now.
              Consider holding contribution in cash until signals emerge.
            </div>
          </div>
        )}

        {/* allocation cards */}
        {!kellyLoading && !kellyError && allocations.length > 0 && (
          <>
            {/* summary strip */}
            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 20,
                padding: "12px 16px",
                background: C.surface2,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>CONTRIBUTION</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>{fmt$(monthly)}</div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>SPLIT ACROSS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                  {allocations.length} position{allocations.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>METHOD</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>KELLY OPTIMAL</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    fontStyle: "italic",
                    maxWidth: 220,
                    lineHeight: 1.5,
                  }}
                >
                  Weights re-normalised across BUY positions.
                  Drift = Kelly target − current allocation.
                </div>
              </div>
            </div>

            {/* cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allocations.map((a) => (
                <AllocationCard key={a.ticker} {...a} />
              ))}
            </div>

            {/* visual bar breakdown */}
            <div
              style={{
                marginTop: 20,
                padding: "16px",
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 12, letterSpacing: "0.06em" }}>
                CONTRIBUTION BREAKDOWN
              </div>
              <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 4, overflow: "hidden" }}>
                {allocations.map((a, i) => {
                  const hues = [210, 160, 280, 40, 10, 190, 130, 330, 60, 240];
                  const hue  = hues[i % hues.length];
                  return (
                    <div
                      key={a.ticker}
                      style={{
                        flex: a.kellyWeight,
                        background: `hsl(${hue}, 70%, 55%)`,
                        transition: "flex 0.4s ease",
                      }}
                      title={`${a.ticker}: ${fmt$(a.dollarAmount)}`}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                {allocations.map((a, i) => {
                  const hues = [210, 160, 280, 40, 10, 190, 130, 330, 60, 240];
                  const hue  = hues[i % hues.length];
                  return (
                    <div
                      key={a.ticker}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: `hsl(${hue}, 70%, 55%)`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, color: C.textMuted }}>
                        {a.ticker}{" "}
                        <span style={{ color: C.text }}>{fmt$(a.dollarAmount)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
