import { C } from "../styles/colorScheme.js";
// renderer/pages/Performance.jsx
// Investment performance tracking + LCPE validation + goal trajectory

import { useEffect, useState, useCallback } from 'react';

const mono = { fontFamily: 'IBM Plex Mono' };

const fmt = (n, d = 1) => Number(n || 0).toFixed(d);
const fmtUSD = n => '$' + Math.abs(Number(n || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmtPct = (n, d = 1) => Number(n || 0).toFixed(d) + '%';

export default function Performance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.jupiter.invoke('performance:getAnalysis');
      if (result.ok) {
        setData(result);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: C.textMuted, ...mono }}>Loading performance analysis…</div>;
  if (error) return <div style={{ padding: '2rem', color: C.red, ...mono }}>Error: {error}</div>;
  if (!data) return null;

  const { summary, goalMetrics, lcpeValidation, investments } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, color: C.text }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ ...mono, fontSize: 24, fontWeight: 800, margin: 0 }}>Performance & Learning</h1>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '6px 0 0' }}>
            Investment outcomes + LCPE validation + goal trajectory
          </p>
        </div>
        <button
          onClick={fetchPerformance}
          style={{ ...mono, fontSize: 11, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Goal Progress */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: '0.12em', marginBottom: 16 }}>
          $1M GOAL TRAJECTORY
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Current Value', value: fmtUSD(goalMetrics.currentPortfolioValue), color: C.text },
            { label: 'Progress', value: fmtPct(goalMetrics.progressPct), color: goalMetrics.progressPct > 50 ? C.green : C.gold },
            { label: 'Remaining', value: fmtUSD(goalMetrics.remaining), color: C.textSec },
            { label: 'Years Left', value: fmt(goalMetrics.yearsRemaining), color: C.textMuted },
            { label: 'Required CAGR', value: fmtPct(goalMetrics.requiredCAGR), color: C.gold },
          ].map(s => (
            <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ ...mono, fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ background: C.panel, borderRadius: 6, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ ...mono, fontSize: 10, color: C.textMuted }}>$100k → $1M by {goalMetrics.goalYear}</span>
            <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: goalMetrics.onTrack ? C.green : C.red }}>
              {goalMetrics.onTrack ? '✓ ON TRACK' : '⚠ OFF TRACK'}
            </span>
          </div>
          <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${Math.min(goalMetrics.progressPct, 100)}%`, 
                height: '100%', 
                background: goalMetrics.onTrack ? C.green : C.gold,
                borderRadius: 4,
              }} 
            />
          </div>
          <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 8 }}>
            Projected: {fmtUSD(goalMetrics.projectedValue)} by {goalMetrics.goalYear}
          </div>
        </div>
      </div>

      {/* LCPE Validation */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: '0.12em', marginBottom: 16 }}>
          LCPE WIN RATE VALIDATION
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Overall Win Rate', value: fmtPct(lcpeValidation.overallWinRate), color: lcpeValidation.overallWinRate > 60 ? C.green : C.gold },
            { label: 'Top 3 Win Rate', value: fmtPct(lcpeValidation.top3WinRate), color: lcpeValidation.top3WinRate > 70 ? C.green : C.gold },
            { label: 'Avg Return', value: fmtPct(lcpeValidation.avgReturnPct), color: lcpeValidation.avgReturnPct > 0 ? C.green : C.red },
            { label: 'Total Investments', value: lcpeValidation.totalEntries, color: C.text },
          ].map(s => (
            <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ ...mono, fontSize: 15, fontWeight: 800, color: s.color }}>
                {typeof s.value === 'string' ? s.value : s.value}
              </div>
            </div>
          ))}
        </div>

        {lcpeValidation.bestPerformer && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: `${C.green}08`, border: `1px solid ${C.green}30`, borderRadius: 8, padding: 12 }}>
              <div style={{ ...mono, fontSize: 9, color: C.green, marginBottom: 6 }}>BEST PERFORMER</div>
              <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: C.green }}>
                {lcpeValidation.bestPerformer.symbol}
              </div>
              <div style={{ ...mono, fontSize: 11, color: C.green, marginTop: 4 }}>
                +{fmt(lcpeValidation.bestPerformer.gainLossPct, 1)}% ({fmtUSD(lcpeValidation.bestPerformer.gainLoss)})
              </div>
            </div>
            <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: 12 }}>
              <div style={{ ...mono, fontSize: 9, color: C.red, marginBottom: 6 }}>WORST PERFORMER</div>
              <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: C.red }}>
                {lcpeValidation.worstPerformer.symbol}
              </div>
              <div style={{ ...mono, fontSize: 11, color: C.red, marginTop: 4 }}>
                {fmt(lcpeValidation.worstPerformer.gainLossPct, 1)}% ({fmtUSD(lcpeValidation.worstPerformer.gainLoss)})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Investment History Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px' }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.12em', marginBottom: 16 }}>
          INVESTMENT HISTORY
        </div>

        {investments.length === 0 ? (
          <div style={{ ...mono, fontSize: 13, color: C.textMuted, padding: '20px' }}>
            No investments logged yet. Execute your first DCA in Insights tab.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', color: C.textMuted, fontWeight: 600 }}>DATE</th>
                  <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>SYMBOL</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>AMOUNT</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>ENTRY PRICE</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>CURRENT PRICE</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>P&L</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>RETURN %</th>
                  <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>DAYS</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 0', color: C.text }}>{inv.date}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: C.cyan, fontWeight: 700 }}>{inv.symbol}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.text }}>{fmtUSD(inv.amount)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.textSec }}>
                      {inv.entryPrice > 0 ? fmtUSD(inv.entryPrice) : '—'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.textSec }}>
                      {inv.currentPrice > 0 ? fmtUSD(inv.currentPrice) : '—'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: inv.gainLoss > 0 ? C.green : inv.gainLoss < 0 ? C.red : C.textMuted, fontWeight: 700 }}>
                      {inv.gainLoss > 0 ? '+' : ''}{fmtUSD(inv.gainLoss)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: inv.gainLossPct > 0 ? C.green : inv.gainLossPct < 0 ? C.red : C.textMuted, fontWeight: 700 }}>
                      {inv.gainLossPct > 0 ? '+' : ''}{fmt(inv.gainLossPct, 1)}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', color: C.textMuted }}>{inv.daysHeld}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary row */}
        {investments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
            {[
              { label: 'Total Invested', value: fmtUSD(summary.totalInvested), color: C.text },
              { label: 'Current Value', value: fmtUSD(summary.totalCurrentValue), color: C.text },
              { label: 'Total Gain/Loss', value: fmtUSD(summary.totalGainLoss), color: summary.totalGainLoss > 0 ? C.green : C.red },
              { label: 'Return %', value: fmtPct(summary.totalReturnPct), color: summary.totalReturnPct > 0 ? C.green : C.red },
            ].map(s => (
              <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ ...mono, fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 20, opacity: 0.55 }}>
        Performance calculated from investment journal. Entry prices, current prices, and returns updated automatically.
        LCPE win rate validates whether top-ranked assets outperform. Goal trajectory recalculates in real-time.
      </p>
    </div>
  );
}
