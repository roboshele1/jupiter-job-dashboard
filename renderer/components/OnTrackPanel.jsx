import { useEffect, useState, useCallback } from "react";

const REQUIRED_CAGR = 26.7;

function gradeColor(g) {
  return { A: '#4ade80', B: '#60a5fa', C: '#fbbf24', D: '#fb923c', F: '#f87171' }[g] || '#9ca3af';
}

function healthColor(returnPct, expectedCagr) {
  if (returnPct === null || !expectedCagr) return '#9ca3af';
  if (returnPct >= expectedCagr * 0.5)  return '#4ade80';
  if (returnPct >= 0)                    return '#fbbf24';
  return '#f87171';
}

function healthLabel(returnPct, expectedCagr) {
  if (returnPct === null || !expectedCagr) return '—';
  if (returnPct >= expectedCagr * 0.5)  return '✓ ON THESIS';
  if (returnPct >= 0)                    return '~ LAGGING';
  return '✗ UNDERPERFORMING';
}

export default function OnTrackPanel() {
  const [cagr, setCagr]           = useState(null);
  const [positions, setPositions] = useState([]);
  const [topActions, setTopActions] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    try {
      // 1. Portfolio CAGR
      const cagrRes = await window.jupiter.invoke('ml:cagrForecast');
      if (cagrRes?.ok) setCagr(cagrRes.data);

      // 2. Join snapshot liveValue + holdings costBasis + expectedCagr
      const [snapRes, holdingsRaw] = await Promise.all([
        window.jupiter.invoke('portfolio:getSnapshot'),
        window.jupiter.invoke('holdings:getRaw'),
      ]);

      const snapshotPositions = snapRes?.portfolio?.positions || snapRes?.rows || [];
      const holdings = Array.isArray(holdingsRaw) ? holdingsRaw : [];

      const holdingMap = {};
      holdings.forEach(h => { holdingMap[h.symbol] = h; });

      const joined = snapshotPositions
        .map(p => {
          const h = holdingMap[p.symbol];
          if (!h?.expectedCagr) return null;
          const costBasis = h.totalCostBasis || 0;
          const liveValue = p.liveValue || 0;
          const returnPct = costBasis > 0 ? ((liveValue - costBasis) / costBasis) * 100 : null;
          return { symbol: p.symbol, returnPct, expectedCagr: h.expectedCagr, liveValue, costBasis };
        })
        .filter(Boolean);

      setPositions(joined);

      // 3. Top actions from technical signals
      const snap = await window.jupiter.invoke('portfolio:technicalSignals:getSnapshot');
      const signals = snap?.data?.signals || snap?.signals || [];
      if (signals.length > 0) {
        const scored = await Promise.all(
          signals.map(async (s) => {
            const price = s.price;
            const sma20 = s.movingAverages?.sma20;
            const sma50 = s.movingAverages?.sma50;
            const w40   = s.movingAverages?.sma200w;
            if (!price || !sma20) return null;
            const res = await window.jupiter.invoke('ml:entryTimingScore', {
              symbol: s.symbol, price, sma20, sma50, w40,
              trend: s.trend, momentum: s.momentum, location: s.location,
            });
            if (!res?.ok) return null;
            return { symbol: s.symbol, score: res.data.score, grade: res.data.grade, verdict: res.data.verdict };
          })
        );
        const valid = scored.filter(Boolean).sort((a, b) => b.score - a.score);
        setTopActions(valid.slice(0, 2));
      }
    } catch (e) {
      console.error('[OnTrackPanel]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const liveCagr  = cagr?.cagr ?? null;
  const ahead     = liveCagr !== null ? liveCagr >= REQUIRED_CAGR : null;
  const cagrColor = ahead === null ? '#9ca3af' : ahead ? '#4ade80' : '#f87171';
  const cagrLabel = ahead === null ? '—' : ahead ? '✓ AHEAD' : '✗ BEHIND';

  return (
    <div style={{
      background: "rgba(17,24,39,0.9)",
      border: `1px solid ${cagrColor}35`,
      borderRadius: 14,
      padding: "22px 24px",
      marginBottom: 20,
      boxShadow: `0 0 28px ${cagrColor}08`,
    }}>
      <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.1em", marginBottom: 18 }}>ON TRACK TO $1M BY 2037?</div>

      {loading ? (
        <div style={{ fontSize: 13, color: "#6b7280" }}>Analysing…</div>
      ) : (
        <>
          {/* ── Section 1: CAGR ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>YOUR CAGR</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: cagrColor, lineHeight: 1 }}>
                {liveCagr !== null ? `${liveCagr.toFixed(1)}%` : '—'}
              </div>
            </div>
            <div style={{ color: "#374151", fontSize: 20, alignSelf: "flex-end", paddingBottom: 2 }}>vs</div>
            <div>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>REQUIRED</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#6b7280", lineHeight: 1 }}>{REQUIRED_CAGR}%</div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: cagrColor,
              background: `${cagrColor}15`, border: `1px solid ${cagrColor}40`,
              borderRadius: 6, padding: "5px 14px", letterSpacing: "0.06em", alignSelf: "center",
            }}>{cagrLabel}</div>
            {cagr?.dataPoints !== undefined && (
              <div style={{ fontSize: 11, color: "#374151", marginLeft: "auto", alignSelf: "center" }}>
                {cagr.dataPoints} snapshots · R² {cagr.rSquared}
              </div>
            )}
          </div>

          {/* ── Section 2: Position Health ── */}
          {positions.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 10 }}>POSITION HEALTH vs THESIS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {positions.map(p => {
                  const hc = healthColor(p.returnPct, p.expectedCagr);
                  const hl = healthLabel(p.returnPct, p.expectedCagr);
                  const barWidth = p.returnPct !== null
                    ? Math.min(100, Math.max(0, ((p.returnPct + 50) / 100) * 100))
                    : 0;
                  return (
                    <div key={p.symbol} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "8px 12px", borderRadius: 8,
                      background: "rgba(0,0,0,0.25)", border: `1px solid ${hc}18`,
                    }}>
                      <span style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 13, width: 52, flexShrink: 0 }}>{p.symbol}</span>
                      <span style={{ fontSize: 11, color: "#4b5563", width: 76, flexShrink: 0 }}>thesis {p.expectedCagr}%</span>
                      <span style={{ fontSize: 11, color: hc, width: 52, flexShrink: 0, fontWeight: 600 }}>
                        {p.returnPct !== null ? `${p.returnPct >= 0 ? '+' : ''}${p.returnPct.toFixed(1)}%` : '—'}
                      </span>
                      <div style={{ flex: 1, height: 4, background: "#1f2937", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${barWidth}%`, height: "100%", background: hc, borderRadius: 2, transition: "width 0.5s ease" }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: hc, width: 130, flexShrink: 0, textAlign: "right" }}>{hl}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section 3: Today's Action ── */}
          {topActions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 10 }}>TODAY'S ACTION</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {topActions.map((a, i) => {
                  const gc = gradeColor(a.grade);
                  return (
                    <div key={a.symbol} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 8,
                      background: i === 0 ? `${gc}10` : "rgba(0,0,0,0.2)",
                      border: `1px solid ${gc}${i === 0 ? '40' : '20'}`,
                    }}>
                      <span style={{ fontSize: 12, color: "#6b7280", width: 14 }}>{i === 0 ? '→' : '·'}</span>
                      <span style={{ fontWeight: 800, color: "#fff", fontSize: 14, width: 52 }}>{a.symbol}</span>
                      <div style={{ width: 60, height: 5, background: "#1f2937", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${a.score}%`, height: "100%", background: gc, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: gc }}>{a.score}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: gc,
                        background: `${gc}18`, border: `1px solid ${gc}40`,
                        borderRadius: 4, padding: "1px 6px",
                      }}>{a.grade}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{a.verdict}</span>
                    </div>
                  );
                })}
            </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
