import { C } from "../styles/colorScheme.js";
/**
 * RiskCentre.jsx — Session 6c
 * Full institutional risk intelligence display
 */

import { useState, useEffect } from 'react';


const mono = { fontFamily: 'IBM Plex Mono' };

const fmtUSD = n => typeof n === 'number'
  ? (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
  : '—';

const fmt = (n, d=1) => typeof n === 'number' ? n.toFixed(d) : '—';

function postureColor(p) {
  return { STABLE:'#22c55e', ELEVATED:'#f59e0b', TENSE:'#ef4444', STRETCHED:'#a855f7' }[p] ?? '#94a3b8';
}
function pressureColor(p) {
  return { NORMAL:'#22c55e', MODERATE:'#f59e0b', ELEVATED:'#ef4444', UNAVAILABLE:'#6b7280', UNKNOWN:'#6b7280' }[p] ?? '#94a3b8';
}
function heatColor(s) {
  return { NORMAL:'#22c55e', ELEVATED:'#f59e0b', OVERHEATED:'#ef4444' }[s] ?? '#94a3b8';
}
function hhiColor(l) {
  return { DIVERSIFIED:'#22c55e', MODERATE:'#06b6d4', CONCENTRATED:'#f59e0b', HIGH_CONCENTRATION:'#ef4444' }[l] ?? '#94a3b8';
}
function warnColor(l) {
  return { CRITICAL:'#ef4444', HIGH:'#f59e0b', MODERATE:'#06b6d4' }[l] ?? '#94a3b8';
}
function clusterRiskColor(r) {
  return { HIGH:'#ef4444', MODERATE:'#f59e0b', LOW:'#22c55e' }[r] ?? '#94a3b8';
}

function Panel({ title, accent, children, fullWidth }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: 'hidden', marginBottom: 14,
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}>
      <div style={{
        background: C.panel, borderBottom: `1px solid ${C.border}`,
        padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 3, height: 13, background: accent ?? C.blue, borderRadius: 2 }} />
        <span style={{ ...mono, fontSize: 10, color: C.textSec, letterSpacing: '0.08em' }}>{title}</span>
      </div>
      <div style={{ padding: '13px 16px' }}>{children}</div>
    </div>
  );
}

function Row({ label, value, sub, accent, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: last ? 'none' : `1px solid ${C.border}`,
      ...mono, fontSize: 12,
    }}>
      <div>
        <div style={{ color: C.textSec }}>{label}</div>
        {sub && <div style={{ color: C.textMuted, fontSize: 10, marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: accent ?? C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function DriverPill({ label, value, color }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '10px 14px', flex: 1,
    }}>
      <div style={{ ...mono, fontSize: 9, color: C.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ ...mono, fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function RiskCentre() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await window.jupiter.invoke('riskCentre:intelligence:v2');
      if (!r?.ok) throw new Error(r?.error ?? 'Engine error');
      setData(r);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const posture  = data?.posture        ?? '—';
  const drivers  = data?.drivers        ?? {};
  const conc     = data?.concentration  ?? null;
  const clusters = data?.correlationClusters ?? [];
  const scenarios= data?.scenarios      ?? [];
  const goal     = data?.goal           ?? null;
  const pv       = data?.portfolioValue ?? 0;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px', color: C.text, ...mono }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:16, fontWeight:700, letterSpacing:'0.1em' }}>RISK CENTRE</h1>
          <p style={{ margin:'3px 0 0', fontSize:11, color:C.textMuted }}>
            Posture · Concentration · Correlation · Scenario Analysis
          </p>
        </div>
        <button onClick={load} style={{
          background:C.surface, border:`1px solid ${C.border}`, color:C.textSec,
          padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:11, ...mono,
        }}>↻ Refresh</button>
      </div>

      {error && (
        <div style={{
          background:'#ef44441a', border:`1px solid ${C.red}`, borderRadius:8,
          padding:'12px 16px', marginBottom:16, fontSize:12, color:C.red,
        }}>⚠ {error}</div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'60px 0', color:C.textMuted, fontSize:12 }}>
          Computing risk intelligence...
        </div>
      )}

      {!loading && data && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* ── POSTURE + DRIVERS ── */}
          <Panel title="RISK POSTURE" accent={postureColor(posture)}>
            {/* Big posture label */}
            <div style={{ fontSize:30, fontWeight:700, color:postureColor(posture), letterSpacing:'0.06em', marginBottom:16 }}>
              {posture}
            </div>

            {/* Driver pills */}
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <DriverPill
                label="GROWTH PRESSURE"
                value={drivers.growth?.pressure ?? '—'}
                color={pressureColor(drivers.growth?.pressure)}
              />
              <DriverPill
                label="SIGNAL PRESSURE"
                value={drivers.signals?.pressure ?? '—'}
                color={pressureColor(drivers.signals?.pressure)}
              />
              <DriverPill
                label="KELLY HEAT"
                value={drivers.heat?.status ?? 'N/A'}
                color={heatColor(drivers.heat?.status)}
              />
            </div>

            {/* Detail rows */}
            {drivers.growth && (
              <Row label="Required CAGR" sub="growth pressure driver"
                value={`${drivers.growth.requiredCAGR}%/yr`}
                accent={pressureColor(drivers.growth.pressure)} />
            )}
            {drivers.signals && (
              <Row label="Material Signals" sub={`${drivers.signals.surfacedCount} total surfaced`}
                value={`${drivers.signals.materialCount} material`}
                accent={pressureColor(drivers.signals.pressure)} />
            )}
            {drivers.heat && (
              <Row label="Portfolio Heat" sub={`max ${drivers.heat.maxAllowedHeat}%`}
                value={`${fmt(drivers.heat.totalHeat)}%`}
                accent={heatColor(drivers.heat.status)} last />
            )}
          </Panel>

          {/* ── GOAL GAP RISK ── */}
          {goal && (
            <Panel title="GOAL GAP RISK · 2037" accent={C.gold}>
              <Row label="Required CAGR to $1M" value={`${fmt(goal.requiredCAGR)}%`} accent={C.gold} />
              <Row label="Gap Remaining"         value={fmtUSD(goal.gap)}            accent={C.red}  />
              <Row label="Progress to $1M"       value={`${fmt(goal.progressPct)}%`} accent={C.cyan} />
              <Row label="Years Remaining"       value={fmt(goal.yearsRemaining, 1)} />
              <Row label="Current Value"         value={fmtUSD(pv)}                  accent={C.text} last />
              <div style={{ marginTop:10, fontSize:10, color:C.textMuted, lineHeight:1.7 }}>
                Sustaining {fmt(goal.requiredCAGR)}%/yr CAGR requires {pv < 100000 ? 'reaching $100k first, then' : ''} compounding
                all high-conviction positions. A single year below target increases the required rate for remaining years.
              </div>
            </Panel>
          )}

          {/* ── CONCENTRATION RISK ── */}
          {conc && (
            <Panel title="CONCENTRATION RISK (HHI)" accent={hhiColor(conc.label)}>
              <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:26, fontWeight:700, color:hhiColor(conc.label) }}>{conc.hhi.toFixed(3)}</span>
                <span style={{ fontSize:11, color:hhiColor(conc.label), letterSpacing:'0.06em' }}>{conc.label}</span>
              </div>
              <div style={{ fontSize:10, color:C.textMuted, marginBottom:12 }}>
                0 = perfectly diversified · 1 = single position · &lt;0.15 is healthy
              </div>

              {/* Warnings */}
              {conc.warnings?.length > 0 && (
                <div style={{ marginBottom:12 }}>
                  {conc.warnings.map((w,i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'flex-start', gap:8,
                      padding:'6px 10px', marginBottom:4,
                      background:`${warnColor(w.level)}15`,
                      border:`1px solid ${warnColor(w.level)}44`,
                      borderRadius:6, fontSize:11, color:warnColor(w.level),
                    }}>
                      <span style={{ flexShrink:0 }}>
                        {w.level === 'CRITICAL' ? '⚠' : w.level === 'HIGH' ? '▲' : '●'}
                      </span>
                      {w.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Top positions */}
              <div style={{ fontSize:10, color:C.textMuted, letterSpacing:'0.06em', marginBottom:6 }}>TOP POSITIONS BY WEIGHT</div>
              {conc.top.map(p => {
                const w = parseFloat(p.weight);
                return (
                  <div key={p.symbol} style={{
                    display:'grid', gridTemplateColumns:'60px 1fr 60px 50px',
                    gap:8, padding:'6px 0', borderBottom:`1px solid ${C.border}`, fontSize:12, alignItems:'center',
                  }}>
                    <span style={{ color:C.cyan }}>{p.symbol}</span>
                    {/* Weight bar */}
                    <div style={{ height:4, background:C.panel, borderRadius:2 }}>
                      <div style={{ width:`${Math.min(w*2,100)}%`, height:'100%', background: w>25?C.red:w>15?C.gold:C.blue, borderRadius:2 }} />
                    </div>
                    <span style={{ color:C.textSec, textAlign:'right' }}>{fmtUSD(p.value)}</span>
                    <span style={{ color:w>25?C.red:w>15?C.gold:C.textSec, textAlign:'right', fontWeight:w>15?700:400 }}>{p.weight}%</span>
                  </div>
                );
              })}
            </Panel>
          )}

          {/* ── CORRELATION CLUSTERS ── */}
          {clusters.length > 0 && (
            <Panel title="CORRELATION CLUSTERS" accent={C.purple}>
              <div style={{ fontSize:10, color:C.textMuted, marginBottom:12, lineHeight:1.6 }}>
                Assets that move together create hidden concentration risk.
                Cluster weight compounds single-asset exposure.
              </div>
              {clusters.map((cl,i) => (
                <div key={i} style={{
                  padding:'10px 12px', marginBottom:8,
                  background:C.panel, border:`1px solid ${C.border}`, borderRadius:8,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:C.text, fontWeight:600 }}>{cl.name}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, color:clusterRiskColor(cl.risk), fontWeight:700 }}>{cl.clusterPct}%</span>
                      <span style={{
                        fontSize:9, color:clusterRiskColor(cl.risk),
                        border:`1px solid ${clusterRiskColor(cl.risk)}44`,
                        borderRadius:4, padding:'1px 6px', letterSpacing:'0.06em',
                      }}>{cl.risk}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                    {cl.positions.map(p => (
                      <span key={p.symbol} style={{
                        fontSize:10, color:C.cyan, background:`${C.cyan}15`,
                        border:`1px solid ${C.cyan}33`, borderRadius:4, padding:'2px 7px',
                      }}>{p.symbol} {p.weight}%</span>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:C.textMuted, lineHeight:1.5 }}>{cl.note}</div>
                </div>
              ))}
            </Panel>
          )}

          {/* ── STRESS SCENARIOS (full width) ── */}
          {scenarios.length > 0 && (
            <Panel title="STRESS SCENARIOS · SECTOR-AWARE" accent={C.purple} fullWidth>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                {scenarios.map((sc,i) => {
                  const neg = parseFloat(sc.impactPct) < 0;
                  const col = neg ? C.red : C.green;
                  return (
                    <div key={i} style={{
                      background:C.panel, border:`1px solid ${C.border}`,
                      borderRadius:8, padding:'12px',
                    }}>
                      <div style={{ fontSize:10, color:C.textMuted, marginBottom:8, lineHeight:1.5 }}>{sc.name}</div>
                      <div style={{ fontSize:20, fontWeight:700, color:col, marginBottom:4 }}>
                        {neg?'':'+'}{ fmt(parseFloat(sc.impactPct))}%
                      </div>
                      <div style={{ fontSize:11, color:col, marginBottom:6 }}>
                        {neg?'−':'+'}{ fmtUSD(Math.abs(sc.affectedValue))}
                      </div>
                      <div style={{ fontSize:9, color:C.textMuted }}>↳ {sc.drivers}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:10, fontSize:10, color:C.textMuted }}>
                Impact calculated from actual sector exposure in your portfolio. Not generic percentages.
              </div>
            </Panel>
          )}

        </div>
      )}
    </div>
  );
}
