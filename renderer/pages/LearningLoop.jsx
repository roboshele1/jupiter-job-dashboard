import { C } from "../styles/colorScheme.js";
// renderer/pages/LearningLoop.jsx
// Kelly conviction adaptation based on realized performance outcomes

import { useEffect, useState, useCallback } from 'react';

const mono = { fontFamily: 'IBM Plex Mono' };

const fmtPct = (n, d = 1) => Number(n || 0).toFixed(d) + '%';

export default function LearningLoop() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLearning = useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.jupiter.invoke('learning:computeAdjustments');
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
    fetchLearning();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: C.textMuted, ...mono }}>Analyzing performance outcomes…</div>;
  if (error) return <div style={{ padding: '2rem', color: C.red, ...mono }}>Error: {error}</div>;
  if (!data) return null;

  const { adjustments, summary } = data;

  if (Object.keys(adjustments).length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1400, color: C.text }}>
        <h1 style={{ ...mono, fontSize: 24, fontWeight: 800, margin: 0 }}>Learning Loop</h1>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '6px 0 0' }}>
          Kelly conviction adaptation based on investment outcomes
        </p>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginTop: 24 }}>
          <div style={{ ...mono, fontSize: 13, color: C.textMuted }}>
            No investment history yet. Execute investments in the Insights tab to start the learning loop.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, color: C.text }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ ...mono, fontSize: 24, fontWeight: 800, margin: 0 }}>Learning Loop</h1>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '6px 0 0' }}>
            Kelly conviction adaptation based on realized performance outcomes
          </p>
        </div>
        <button
          onClick={fetchLearning}
          style={{ ...mono, fontSize: 11, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: '0.12em', marginBottom: 16 }}>
            LEARNING SUMMARY
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Symbols Analyzed', value: summary.symbolsAnalyzed || 0, color: C.text },
              { label: 'Avg Adjustment', value: fmtPct((summary.avgDeltaPct || 0) / 100), color: (summary.avgDeltaPct || 0) > 0 ? C.green : C.red },
            ].map(s => (
              <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: s.color }}>
                  {typeof s.value === 'number' ? s.value : s.value}
                </div>
              </div>
            ))}
          </div>

          {summary.topImprovement && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: `${C.green}08`, border: `1px solid ${C.green}30`, borderRadius: 8, padding: 12 }}>
                <div style={{ ...mono, fontSize: 9, color: C.green, marginBottom: 6 }}>TOP IMPROVEMENT</div>
                <div style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.green }}>
                  {summary.topImprovement[0]}
                </div>
                <div style={{ ...mono, fontSize: 11, color: C.green, marginTop: 4 }}>
                  +{fmtPct(summary.topImprovement[1]?.convictionDelta / 100)}
                </div>
              </div>
              {summary.topDeclination && (
                <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: 12 }}>
                  <div style={{ ...mono, fontSize: 9, color: C.red, marginBottom: 6 }}>TOP DECLINATION</div>
                  <div style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.red }}>
                    {summary.topDeclination[0]}
                  </div>
                  <div style={{ ...mono, fontSize: 11, color: C.red, marginTop: 4 }}>
                    {fmtPct(summary.topDeclination[1]?.convictionDelta / 100)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conviction Adjustments */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px' }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: '0.12em', marginBottom: 16 }}>
          CONVICTION ADJUSTMENTS (per symbol)
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '10px 0', color: C.textMuted, fontWeight: 600 }}>SYMBOL</th>
                <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>ACTUAL WIN %</th>
                <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>PREDICTED WIN %</th>
                <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>DELTA</th>
                <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>ADJUSTMENT</th>
                <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>TRADES</th>
                <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>AVG RETURN</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(adjustments)
                .sort((a, b) => Math.abs(b[1].convictionDelta) - Math.abs(a[1].convictionDelta))
                .map(([symbol, adj]) => {
                  const deltaColor = adj.convictionDelta > 0 ? C.green : adj.convictionDelta < 0 ? C.red : C.textMuted;
                  const adjColor = adj.suggestedAdjustment > 0 ? C.green : adj.suggestedAdjustment < 0 ? C.red : C.textMuted;
                  return (
                    <tr key={symbol} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 0', color: C.cyan, fontWeight: 700 }}>{symbol}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: C.green, fontWeight: 700 }}>
                        {adj.realizedWinRate}%
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: C.textSec }}>
                        {adj.predictedWinRate}%
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: deltaColor, fontWeight: 700 }}>
                        {adj.convictionDelta > 0 ? '+' : ''}{fmtPct(adj.convictionDelta / 100)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: adjColor, fontWeight: 700 }}>
                        {adj.suggestedAdjustment > 0 ? '+' : ''}{adj.suggestedAdjustment.toFixed(3)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: C.textMuted }}>
                        {adj.winCount}W / {adj.lossCount}L ({adj.totalTrades})
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: adj.avgReturnPct > 0 ? C.green : C.red, fontWeight: 700 }}>
                        {adj.avgReturnPct > 0 ? '+' : ''}{fmtPct(adj.avgReturnPct / 100)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 20, opacity: 0.55 }}>
        Learning loop compares realized outcomes (actual win %) to Kelly's predictions (predicted conviction). 
        Positive delta = Kelly underestimated conviction. Negative delta = Kelly overestimated conviction.
        Adjustments dampen over time to prevent over-correction. This is how Kelly improves quarterly.
      </p>
    </div>
  );
}
