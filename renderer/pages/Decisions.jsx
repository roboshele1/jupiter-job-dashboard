import { C } from "../styles/colorScheme.js";
import { useState, useEffect } from 'react';

export default function Decisions() {
  const [decisions, setDecisions] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadDecisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.jupiter.invoke('decisions:getUnifiedDecisions');
      setDecisions(data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load decisions:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDecisions(); }, []);

  const actionColor = (action) => {
    if (action === 'EXIT_OR_AVOID')                        return '#f87171';
    if (action === 'TRIM' || action === 'TRIM_TO_MINIMAL') return '#fb923c';
    if (action === 'ADD')                                  return '#4ade80';
    return '#9ca3af';
  };

  const heatColor = (status) => {
    if (status === 'OVERHEATED') return '#f87171';
    if (status === 'ELEVATED')   return '#fb923c';
    return '#4ade80';
  };

  const priorityStyle = (priority) => {
    const base = { padding: '2px 8px', borderRadius: 4, fontSize: 11, border: '1px solid' };
    if (priority === 'HIGH')   return { ...base, background: 'rgba(248,113,113,0.15)', color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' };
    if (priority === 'MEDIUM') return { ...base, background: 'rgba(251,191,36,0.15)',  color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)'  };
    return                            { ...base, background: 'rgba(156,163,175,0.15)', color: '#9ca3af', borderColor: 'rgba(156,163,175,0.4)' };
  };

  if (loading) return (
    <div style={{ padding: 40, color: '#9ca3af' }}>
      Loading Kelly recommendations...
    </div>
  );

  if (error) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: '#f87171', marginBottom: 12 }}>
        ⚠️ Failed to load decisions: {error}
      </div>
      <button
        onClick={loadDecisions}
        style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Retry
      </button>
    </div>
  );

  if (!decisions) return null;

  const plColor = decisions.totalUnrealizedPL >= 0 ? '#4ade80' : '#f87171';
  const plSign  = decisions.totalUnrealizedPL >= 0 ? '+' : '';

  return (
    <div style={{ padding: 32, overflowY: 'auto', background: '#060910', minHeight: '100vh', fontFamily: "'IBM Plex Mono', monospace", color: '#e2e8f0' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Kelly Decisions</h1>
          <p style={{ color: '#9ca3af', marginTop: 4, fontSize: 14 }}>
            AI-powered position sizing · Last updated: {lastRefresh || '—'}
          </p>
        </div>
        <button
          onClick={loadDecisions}
          style={{ padding: '8px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'PORTFOLIO VALUE', value: `$${(decisions.portfolioValue ?? 0).toLocaleString()}`, color: '#fff' },
          { label: 'TOTAL BOOK COST', value: `$${(decisions.totalBookCost ?? 0).toLocaleString()}`, color: '#9ca3af' },
          { label: 'UNREALIZED P/L',  value: `${plSign}$${Math.abs(decisions.totalUnrealizedPL).toLocaleString()} (${plSign}${(decisions.totalReturnPct ?? 0).toFixed(1)}%)`, color: plColor }
        ].map(card => (
          <div key={card.label} style={{ background: 'rgba(31,41,55,0.6)', border: '1px solid #374151', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em', marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(31,41,55,0.6)', border: '1px solid #374151', borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Goal: $100k → $1M by 2037</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              ${(decisions.goal?.remaining ?? 0).toLocaleString()} remaining · Required CAGR: {decisions.goal?.requiredCAGR ?? '—'}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{(decisions.goal?.progressPct ?? 0).toFixed(1)}%</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>of goal</div>
          </div>
        </div>
        <div style={{ width: '100%', height: 10, background: '#374151', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(decisions.goal?.progressPct ?? 0, 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 5, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div style={{ background: 'rgba(31,41,55,0.6)', border: '1px solid #374151', borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Portfolio Risk</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>PORTFOLIO HEAT</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: heatColor(decisions.heatCheck?.status) }}>
              {(decisions.heatCheck?.totalHeat ?? 0).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Max: {(decisions.heatCheck?.maxAllowedHeat ?? 0)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>STATUS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: heatColor(decisions.heatCheck?.status) }}>
              {decisions.heatCheck.status}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>OPTIMAL CASH</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
              {(decisions.cashManagement?.optimalCashPct ?? 0).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>${(decisions.cashManagement?.optimalCashReserve ?? 0).toLocaleString()}</div>
          </div>
        </div>
        {decisions.heatCheck?.isOverheated && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13 }}>
            ⚠️ {decisions.heatCheck.recommendation}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TOTAL ACTIONS', value: decisions.summary.totalActions,  color: '#fff',    border: '#374151'              },
          { label: 'ADD',           value: decisions.summary.numAdds,        color: '#4ade80', border: 'rgba(74,222,128,0.3)' },
          { label: 'TRIM',          value: decisions.summary.numTrims,       color: '#fb923c', border: 'rgba(251,146,60,0.3)' },
          { label: 'EXIT',          value: decisions.summary.numExits,       color: '#f87171', border: 'rgba(248,113,113,0.3)'}
        ].map(b => (
          <div key={b.label} style={{ background: 'rgba(31,41,55,0.6)', border: `1px solid ${b.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{b.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: b.color }}>{b.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(31,41,55,0.6)', border: '1px solid #374151', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #374151' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Action Items</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            Execute gradually — start with high priority, 1-2 actions per week
          </div>
        </div>

        {decisions.actions.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
            ✅ Portfolio is optimally sized — no actions needed
          </div>
        ) : (
          decisions.actions.map((action, i) => (
            <div key={action.symbol} style={{ padding: '20px 24px', borderBottom: i < decisions.actions.length - 1 ? '1px solid #1f2937' : 'none' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>{i + 1}.</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{action.symbol}</span>
                  <span style={priorityStyle(action.priority)}>{action.priority}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: actionColor(action.action) }}>
                    {action.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>WIN PROBABILITY</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {(action.winProbability * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div style={{ background: '#1f2937', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>CURRENT POSITION</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                    {action.currentPct.toFixed(1)}% · ${action.currentValue.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: '#1f2937', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>OPTIMAL POSITION</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                    {action.optimalPct.toFixed(1)}% · ${action.optimalValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 17, fontWeight: 700, color: actionColor(action.action), marginBottom: 10 }}>
                {action.deltaValue > 0 ? '→ ADD' : '→ REDUCE'} ${Math.abs(action.deltaValue).toLocaleString()}
                {action.currentPrice > 0 && (
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 400, marginLeft: 10 }}>
                    ≈ {Math.abs(action.deltaValue / action.currentPrice).toFixed(2)} shares @ ${action.currentPrice.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 400, marginLeft: 8 }}>
                  ({action.deltaPct > 0 ? '+' : ''}{action.deltaPct.toFixed(1)}%)
                </span>
              </div>

              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                <span style={{ color: '#6b7280' }}>Conviction:</span> {action.conviction} ·{' '}
                <span style={{ color: '#6b7280' }}>Rationale:</span> {action.rationale}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{action.reasoning}</div>

            </div>
          ))
        )}
      </div>

      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>💡 How This Works</div>
        <div style={{ fontSize: 13, color: 'rgba(147,197,253,0.8)', lineHeight: 1.8 }}>
          Uses Kelly Criterion (proven 70+ years) with 25% fractional sizing for safety.
          Win probability is set per-conviction level. Portfolio heat prevents over-leveraging.
          Execute 1–2 high-priority actions per week, starting with EXIT/TRIM to free capital.
        </div>
      </div>

    </div>
  );
}
