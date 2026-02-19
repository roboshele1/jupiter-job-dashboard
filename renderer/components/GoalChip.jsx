/**
 * GoalChip.jsx — shared slim goal chip for Decisions + Signals tabs
 * Updated: goal year 2037
 */

const S = {
  surface:   '#0c1220',
  panel:     '#0f172a',
  border:    '#1a2540',
  borderAcc: '#2d3f55',
  text:      '#e2e8f0',
  textSec:   '#94a3b8',
  textMuted: '#6b7280',
  green:     '#22c55e',
  red:       '#ef4444',
  blue:      '#3b82f6',
  gold:      '#f59e0b',
  cyan:      '#06b6d4',
};

const fmt = (n, d = 1) =>
  typeof n === 'number' ? n.toFixed(d) : '—';

export default function GoalChip({ goal, onNavigate }) {
  if (!goal) return null;

  const pct     = goal.progressPct  ?? 0;
  const cagr    = goal.requiredCAGR ?? 0;
  const year    = goal.goalYear     ?? 2037;
  const verdict = goal.feasibility  ?? '—';

  const verdictColor =
    verdict === 'ON TRACK'   ? S.green  :
    verdict === 'ACHIEVABLE' ? S.cyan   :
    verdict === 'STRETCH'    ? S.gold   : S.red;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate?.('goal')}
      onKeyDown={e => e.key === 'Enter' && onNavigate?.('goal')}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        background:   S.surface,
        border:       `1px solid ${S.border}`,
        borderRadius: '8px',
        padding:      '9px 14px',
        cursor:       'pointer',
        marginBottom: '16px',
        transition:   'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = S.borderAcc}
      onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
    >
      <div style={{
        width:        '72px',
        height:       '4px',
        background:   S.panel,
        borderRadius: '2px',
        flexShrink:   0,
      }}>
        <div style={{
          width:        `${Math.min(pct, 100)}%`,
          height:       '100%',
          background:   `linear-gradient(90deg, ${S.blue}, ${S.cyan})`,
          borderRadius: '2px',
        }} />
      </div>

      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '11px', color: S.textSec, whiteSpace: 'nowrap' }}>
        {fmt(pct)}% to $1M by {year}
      </span>

      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '11px', color: S.textSec, whiteSpace: 'nowrap' }}>
        Need <span style={{ color: S.gold }}>{fmt(cagr)}% CAGR</span>
      </span>

      <span style={{
        fontFamily:   'IBM Plex Mono',
        fontSize:     '10px',
        color:        verdictColor,
        border:       `1px solid ${verdictColor}44`,
        borderRadius: '4px',
        padding:      '2px 7px',
        whiteSpace:   'nowrap',
      }}>
        {verdict}
      </span>

      <span style={{
        marginLeft:  'auto',
        fontSize:    '10px',
        color:       S.textMuted,
        fontFamily:  'IBM Plex Mono',
        whiteSpace:  'nowrap',
      }}>
        → Goal Engine
      </span>
    </div>
  );
}
