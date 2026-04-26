import { useEffect, useState, useMemo } from "react";

const GOAL = 1_000_000;

function buildCurve(rawEntries) {
  const byDate = {};
  for (const e of rawEntries) {
    const day = e.timestamp.slice(0, 10);
    byDate[day] = e.portfolioValue;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function formatMoney(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Number(n).toFixed(0)}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function EquityCurve() {
  const [curve, setCurve] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.jupiter.invoke("ledger:getHistory");
        if (res?.ok && Array.isArray(res.data) && res.data.length) {
          setCurve(buildCurve(res.data));
        }
      } catch (err) {
        console.error("[EquityCurve]", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const W = 900, H = 220, PL = 64, PR = 24, PT = 20, PB = 36;

  const { minV, maxV } = useMemo(() => {
    if (!curve.length) return { minV: 0, maxV: 1 };
    const vals = curve.map(d => d.value);
    return {
      minV: Math.min(...vals) * 0.96,
      maxV: Math.max(...vals) * 1.04,
    };
  }, [curve]);

  const xScale = i => PL + (i / Math.max(curve.length - 1, 1)) * (W - PL - PR);
  const yScale = v => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);

  const svgPoints = curve.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(" ");
  const goalY = yScale(GOAL);

  const xLabels = useMemo(() => {
    if (!curve.length) return [];
    const count = Math.min(6, curve.length);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round(i * (curve.length - 1) / Math.max(count - 1, 1));
      return { idx, date: curve[idx].date };
    });
  }, [curve]);

  const yLabels = useMemo(() => {
    if (!curve.length) return [];
    return [0, 0.33, 0.66, 1].map(t => ({
      value: minV + t * (maxV - minV),
      y: yScale(minV + t * (maxV - minV)),
    }));
  }, [curve, minV, maxV]);

  const firstValue = curve[0]?.value;
  const lastValue  = curve[curve.length - 1]?.value;
  const totalGain  = lastValue - firstValue;
  const totalGainPct = firstValue ? (totalGain / firstValue) * 100 : 0;
  const gainColor  = totalGain >= 0 ? "#4ade80" : "#f87171";

  if (loading) return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 8 }}>EQUITY CURVE</div>
      <div style={{ color: "#6b7280", fontSize: 13 }}>Loading portfolio history…</div>
    </div>
  );

  if (!curve.length) return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 8 }}>EQUITY CURVE</div>
      <div style={{ color: "#6b7280", fontSize: 13 }}>No history available yet.</div>
    </div>
  );

  return (
    <div style={{ background: "rgba(31,41,55,0.6)", border: "1px solid #374151", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em" }}>EQUITY CURVE</div>
          <div style={{ fontSize: 11, color: "#4b5563", marginTop: 3 }}>
            {curve[0]?.date} → {curve[curve.length - 1]?.date} · {curve.length} sessions
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "INCEPTION", value: formatMoney(firstValue), color: "#9ca3af" },
            { label: "CURRENT",   value: formatMoney(lastValue),  color: "#fff" },
            { label: "TOTAL GAIN", value: `${totalGain >= 0 ? "+" : ""}${formatMoney(totalGain)} (${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(1)}%)`, color: gainColor },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: "0.08em" }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
          onMouseLeave={() => setHovered(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * W;
            let closest = 0, closestDist = Infinity;
            curve.forEach((_, i) => {
              const d = Math.abs(xScale(i) - svgX);
              if (d < closestDist) { closestDist = d; closest = i; }
            });
            setHovered(closestDist < 40 ? closest : null);
          }}
        >
          <defs>
            <linearGradient id="ecAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="ecLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {yLabels.map((yl, i) => (
            <g key={i}>
              <line x1={PL} y1={yl.y} x2={W - PR} y2={yl.y} stroke="#1f2937" strokeWidth="1" />
              <text x={PL - 6} y={yl.y + 4} textAnchor="end" fill="#374151" fontSize="10">{formatMoney(yl.value)}</text>
            </g>
          ))}

          {goalY > PT && goalY < H - PB && (
            <g>
              <line x1={PL} y1={goalY} x2={W - PR} y2={goalY} stroke="#4ade80" strokeWidth="1" strokeDasharray="5,4" opacity="0.4" />
              <text x={W - PR + 2} y={goalY + 4} fill="#4ade80" fontSize="9" opacity="0.6">$1M</text>
            </g>
          )}

          <polygon
            points={`${xScale(0)},${H - PB} ${svgPoints} ${xScale(curve.length - 1)},${H - PB}`}
            fill="url(#ecAreaGrad)"
          />
          <polyline points={svgPoints} fill="none" stroke="url(#ecLineGrad)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {hovered !== null && (
            <>
              <line x1={xScale(hovered)} y1={PT} x2={xScale(hovered)} y2={H - PB} stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
              <circle cx={xScale(hovered)} cy={yScale(curve[hovered].value)} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
            </>
          )}

          {xLabels.map(({ idx, date }) => (
            <text key={idx} x={xScale(idx)} y={H - PB + 18} textAnchor="middle" fill="#374151" fontSize="10">{formatDate(date)}</text>
          ))}
        </svg>

        {hovered !== null && (() => {
          const pct = firstValue ? ((curve[hovered].value - firstValue) / firstValue) * 100 : 0;
          return (
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(10,15,28,0.95)", border: "1px solid #3b82f6", borderRadius: 8, padding: "8px 14px", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10 }}>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>{curve[hovered].date}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{formatMoney(curve[hovered].value)}</div>
              <div style={{ fontSize: 11, color: pct >= 0 ? "#4ade80" : "#f87171" }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}% from inception</div>
            </div>
          );
        })()}
      </div>

      <div style={{ display: "flex", gap: 18, marginTop: 6, fontSize: 10, color: "#4b5563" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 18, height: 2, background: "linear-gradient(90deg,#6366f1,#3b82f6)", borderRadius: 1 }} />
          <span>Portfolio Value</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 18, height: 0, borderTop: "1px dashed #4ade80" }} />
          <span>$1M Goal</span>
        </div>
      </div>
    </div>
  );
}
