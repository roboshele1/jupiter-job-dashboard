import { C } from "../styles/colorScheme.js";
// renderer/pages/Rebalancing.jsx
// Quarterly rebalancing recommendations: trim overweight, add underweight

import { useEffect, useState, useCallback } from 'react';

const mono = { fontFamily: 'IBM Plex Mono' };

const fmtUSD = n => '$' + Math.abs(Number(n || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmtPct = (n, d = 1) => Number(n || 0).toFixed(d) + '%';

export default function Rebalancing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRebalancing = useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.jupiter.invoke('rebalancing:getRecommendations');
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
    fetchRebalancing();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: C.textMuted, ...mono }}>Computing rebalancing logic…</div>;
  if (error) return <div style={{ padding: '2rem', color: C.red, ...mono }}>Error: {error}</div>;
  if (!data) return null;

  const { portfolioValue, recommendations, metrics, positions } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, color: C.text }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ ...mono, fontSize: 24, fontWeight: 800, margin: 0 }}>Quarterly Rebalancing</h1>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '6px 0 0' }}>
            Kelly-optimal trim/add recommendations to hit target allocations
          </p>
        </div>
        <button
          onClick={fetchRebalancing}
          style={{ ...mono, fontSize: 11, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Rebalancing Status */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: '0.12em', marginBottom: 16 }}>
          REBALANCING STATUS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Portfolio Value', value: fmtUSD(portfolioValue), color: C.text },
            { label: 'Average Drift', value: fmtPct(metrics.averageDriftPct), color: metrics.averageDriftPct > 3 ? C.red : C.gold },
            { label: 'Positions Over Cap', value: metrics.positionsOverCap, color: metrics.positionsOverCap > 0 ? C.red : C.green },
            { label: 'Action Required', value: metrics.isRebalanceNeeded ? '⚠ YES' : '✓ NO', color: metrics.isRebalanceNeeded ? C.gold : C.green },
          ].map(s => (
            <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ ...mono, fontSize: 15, fontWeight: 800, color: s.color }}>
                {typeof s.value === 'number' ? s.value : s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRIM Recommendations */}
      {recommendations.trims.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.12em', marginBottom: 16 }}>
            TRIM RECOMMENDATIONS ({recommendations.trims.length} positions)
          </div>

          {recommendations.trims.map(trim => (
            <div key={trim.symbol} style={{ background: `${C.red}08`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: C.red }}>{trim.symbol}</div>
                  <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 4 }}>
                    {trim.reason} · Conviction: {(trim.conviction * 100).toFixed(0)}/100
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.red }}>-{fmtUSD(trim.trimAmount)}</div>
                  <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 2 }}>-{trim.trimShares.toFixed(4)} shares</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Current Allocation</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.red }}>{fmtPct(trim.currentPct)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Target Allocation</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.green }}>{fmtPct(trim.targetPct)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Current Value</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.text }}>{fmtUSD(trim.currentValue)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Target Value</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.green }}>{fmtUSD(trim.targetValue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD Recommendations */}
      {recommendations.adds.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '0.12em', marginBottom: 16 }}>
            ADD RECOMMENDATIONS ({recommendations.adds.length} positions)
          </div>

          {recommendations.adds.map(add => (
            <div key={add.symbol} style={{ background: `${C.green}08`, border: `1px solid ${C.green}30`, borderRadius: 8, padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: C.green }}>{add.symbol}</div>
                  <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 4 }}>
                    {add.reason} · Conviction: {(add.conviction * 100).toFixed(0)}/100
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.green }}>+{fmtUSD(add.addAmount)}</div>
                  <div style={{ ...mono, fontSize: 10, color: C.textMuted, marginTop: 2 }}>+{add.addShares.toFixed(4)} shares</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Current Allocation</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.textMuted }}>{fmtPct(add.currentPct)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Target Allocation</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.green }}>{fmtPct(add.targetPct)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Current Value</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.text }}>{fmtUSD(add.currentValue)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: C.textMuted }}>Target Value</div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.green }}>{fmtUSD(add.targetValue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cash Summary */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.12em', marginBottom: 16 }}>
          CASH FLOW SUMMARY
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total to Trim', value: fmtUSD(recommendations.totalTrimAmount), color: C.red },
            { label: 'Total to Add', value: fmtUSD(recommendations.totalAddAmount), color: C.green },
            { label: 'Cash Needed', value: fmtUSD(recommendations.cashNeeded), color: recommendations.cashNeeded > 0 ? C.gold : C.green },
          ].map(s => (
            <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...mono, fontSize: 9, color: C.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {recommendations.cashNeeded > 0 && (
          <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 8, padding: 12, marginTop: 12 }}>
            <div style={{ ...mono, fontSize: 10, color: C.gold }}>
              ⚠ You need {fmtUSD(recommendations.cashNeeded)} in fresh capital to complete this rebalance. 
              Either deposit cash or reduce trim targets.
            </div>
          </div>
        )}
      </div>

      {/* All Positions */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px' }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: '0.12em', marginBottom: 16 }}>
          ALL POSITIONS (sorted by value)
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '10px 0', color: C.textMuted, fontWeight: 600 }}>SYMBOL</th>
                <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>VALUE</th>
                <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>CURRENT %</th>
                <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>TARGET %</th>
                <th style={{ textAlign: 'right', padding: '10px', color: C.textMuted, fontWeight: 600 }}>DRIFT</th>
                <th style={{ textAlign: 'center', padding: '10px', color: C.textMuted, fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(pos => {
                const status = pos.isOverCap ? 'OVER CAP' : pos.isUnderTarget ? 'UNDER TARGET' : 'OK';
                const statusColor = pos.isOverCap || pos.isUnderTarget ? C.gold : C.green;
                return (
                  <tr key={pos.symbol} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 0', color: C.cyan, fontWeight: 700 }}>{pos.symbol}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.text }}>{fmtUSD(pos.currentValue)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.text }}>{fmtPct(pos.currentPct)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.textSec }}>{fmtPct(pos.targetPct)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: pos.driftPct > 0 ? C.red : C.green, fontWeight: 700 }}>
                      {pos.driftPct > 0 ? '+' : ''}{fmtPct(pos.driftPct, 1)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', color: statusColor, fontWeight: 700 }}>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 20, opacity: 0.55 }}>
        Rebalancing computed quarterly to maintain Kelly-optimal allocations. All recommendations are mathematically derived — no opinion, no bias.
        Execute trims first (raise cash), then execute adds. Use fresh DCA to cover any shortfall.
      </p>
    </div>
  );
}
