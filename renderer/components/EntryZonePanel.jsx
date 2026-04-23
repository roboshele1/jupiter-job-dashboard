import { useState, useRef } from 'react'

const SIGNAL_COLORS = {
  ADD: '#00c48c',
  HOLD: '#f0b429',
  TRIM: '#ff4d4f',
}

const STATE_COLORS = {
  Accumulation: '#00c48c',
  Neutral: '#f0b429',
  Extended: '#ff4d4f',
}

function buildPrompt(symbol, data) {
  return `You are a technical analysis engine for a long-term conviction portfolio. Your job is to translate technical conditions into precise, actionable entry zones and execution guidance for incremental capital deployment.

ASSET: ${symbol}
CURRENT PRICE: $${data.price}
SMA20: ${data.sma20} (price is ${data.vsSma20 >= 0 ? '+' : ''}${data.vsSma20}% vs SMA20)
SMA50: ${data.sma50} (price is ${data.vsSma50 >= 0 ? '+' : ''}${data.vsSma50}% vs SMA50)
40-WEEK AVG: ${data.w40} (price is ${data.vsW40 >= 0 ? '+' : ''}${data.vsW40}% vs 40W)
RANGE LOCATION: ${data.location}
TREND: ${data.trend}
MOMENTUM: ${data.momentum}

CONTEXT:
- Long-term conviction portfolio (not trading)
- Technicals are used for timing optimization only, not primary decision-making
- No overtrading bias
- Must align with long-term compounding strategy

YOUR TASKS:
1. Classify technical state as exactly one of: Accumulation | Neutral | Extended
2. Generate 3 price zones with exact dollar ranges (no single-price recommendations):
   - Primary Buy Zone: highest probability area based on SMA50 proximity or fair value
   - Secondary Buy Zone: deeper pullback, stronger value, lower probability
   - Avoid / Extension Zone: price is too extended above trend
3. Define execution strategy: how to deploy capital across zones, whether immediate entry is justified
4. Output exactly one signal: ADD | HOLD | TRIM
5. Provide suggested allocation split (e.g. 50% primary / 30% secondary / 20% reserve)
6. Confidence level: Low | Medium | High
7. Key technical reasoning: exactly 2-3 bullet points
8. Invalidation level: exact price range where technical thesis breaks

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code fences, raw JSON only):
{
  "technicalState": "Accumulation|Neutral|Extended",
  "signal": "ADD|HOLD|TRIM",
  "confidence": "Low|Medium|High",
  "primaryZone": { "low": 0, "high": 0, "label": "Primary Buy Zone", "rationale": "one sentence" },
  "secondaryZone": { "low": 0, "high": 0, "label": "Secondary Buy Zone", "rationale": "one sentence" },
  "avoidZone": { "low": 0, "high": 0, "label": "Avoid / Extended Zone", "rationale": "one sentence" },
  "allocationSplit": { "primary": 50, "secondary": 30, "reserve": 20 },
  "immediateEntryJustified": true,
  "executionNote": "one to two sentences on how to deploy",
  "reasoning": ["point 1", "point 2", "point 3"],
  "invalidationLevel": { "low": 0, "high": 0, "note": "one sentence" },
  "chasingWarning": true
}`
}

function ZoneBar({ zone, currentPrice, color }) {
  const inZone = currentPrice >= zone.low && currentPrice <= zone.high
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {zone.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {inZone && (
            <span style={{ fontSize: 10, color: color, fontWeight: 700, letterSpacing: '0.1em' }}>
              ◆ PRICE HERE
            </span>
          )}
          <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: 'IBM Plex Mono, monospace' }}>
            ${zone.low.toLocaleString()} – ${zone.high.toLocaleString()}
          </span>
        </div>
      </div>
      <div style={{ height: 4, background: '#1e2330', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: 2, width: '100%', opacity: inZone ? 1 : 0.35 }} />
      </div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{zone.rationale}</div>
    </div>
  )
}

export default function EntryZonePanel({ symbol, data }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const cacheRef = useRef(null)

  async function generate() {
    if (!open) {
      setOpen(true)
      if (cacheRef.current) return
      setLoading(true)
      setError(null)
      try {
        const prompt = buildPrompt(symbol, data)
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        const json = await response.json()
        const raw = json.content?.map(b => b.text || '').join('') || ''
        const cleaned = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        cacheRef.current = parsed
        setResult(parsed)
      } catch (e) {
        setError('Analysis failed — ' + e.message)
      } finally {
        setLoading(false)
      }
    } else {
      setOpen(false)
    }
  }

  const r = result || cacheRef.current

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={generate}
        style={{
          background: 'none',
          border: '1px solid #2a3045',
          borderRadius: 6,
          color: open ? '#7c8cf8' : '#556',
          fontSize: 11,
          fontFamily: 'IBM Plex Mono, monospace',
          letterSpacing: '0.08em',
          padding: '5px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c8cf8'; e.currentTarget.style.color = '#7c8cf8' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = open ? '#7c8cf8' : '#2a3045'; e.currentTarget.style.color = open ? '#7c8cf8' : '#556' }}
      >
        {loading ? '⟳ GENERATING ENTRY ZONES...' : open ? '▲ HIDE ENTRY ZONES' : '▼ ENTRY ZONE ANALYSIS'}
      </button>

      {open && (
        <div style={{
          marginTop: 14,
          borderTop: '1px solid #1e2330',
          paddingTop: 16,
          animation: 'fadeIn 0.2s ease',
        }}>
          {loading && (
            <div style={{ color: '#444', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>
              Analysing technicals for {symbol}...
            </div>
          )}

          {error && (
            <div style={{ color: '#ff4d4f', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>{error}</div>
          )}

          {r && !loading && (
            <div>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <span style={{
                  background: STATE_COLORS[r.technicalState] + '22',
                  color: STATE_COLORS[r.technicalState],
                  border: `1px solid ${STATE_COLORS[r.technicalState]}55`,
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  letterSpacing: '0.1em',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}>
                  {r.technicalState.toUpperCase()}
                </span>
                <span style={{
                  background: SIGNAL_COLORS[r.signal] + '22',
                  color: SIGNAL_COLORS[r.signal],
                  border: `1px solid ${SIGNAL_COLORS[r.signal]}55`,
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  letterSpacing: '0.1em',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}>
                  SIGNAL: {r.signal}
                </span>
                <span style={{
                  fontSize: 11,
                  color: '#888',
                  fontFamily: 'IBM Plex Mono, monospace',
                  letterSpacing: '0.06em',
                }}>
                  CONFIDENCE: {r.confidence.toUpperCase()}
                </span>
                {r.chasingWarning && (
                  <span style={{
                    fontSize: 11,
                    color: '#f0b429',
                    fontFamily: 'IBM Plex Mono, monospace',
                    letterSpacing: '0.06em',
                  }}>
                    ⚠ CHASING RISK
                  </span>
                )}
                {r.immediateEntryJustified && !r.chasingWarning && (
                  <span style={{
                    fontSize: 11,
                    color: '#00c48c',
                    fontFamily: 'IBM Plex Mono, monospace',
                    letterSpacing: '0.06em',
                  }}>
                    ✓ IMMEDIATE ENTRY VALID
                  </span>
                )}
              </div>

              {/* Zones */}
              <div style={{ marginBottom: 18 }}>
                <ZoneBar zone={r.primaryZone} currentPrice={data.price} color="#00c48c" />
                <ZoneBar zone={r.secondaryZone} currentPrice={data.price} color="#f0b429" />
                <ZoneBar zone={r.avoidZone} currentPrice={data.price} color="#ff4d4f" />
              </div>

              {/* Allocation split */}
              <div style={{
                background: '#0d1017',
                border: '1px solid #1e2330',
                borderRadius: 6,
                padding: '10px 14px',
                marginBottom: 14,
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 11, color: '#556', letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono, monospace' }}>ALLOCATION</span>
                <span style={{ fontSize: 12, color: '#00c48c', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Primary {r.allocationSplit.primary}%
                </span>
                <span style={{ fontSize: 12, color: '#f0b429', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Secondary {r.allocationSplit.secondary}%
                </span>
                <span style={{ fontSize: 12, color: '#7c8cf8', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Reserve {r.allocationSplit.reserve}%
                </span>
              </div>

              {/* Execution note */}
              <div style={{
                fontSize: 12,
                color: '#8892a4',
                lineHeight: 1.6,
                marginBottom: 14,
                fontStyle: 'italic',
              }}>
                {r.executionNote}
              </div>

              {/* Reasoning */}
              <div style={{ marginBottom: 14 }}>
                {r.reasoning.map((pt, i) => (
                  <div key={i} style={{
                    fontSize: 12,
                    color: '#8892a4',
                    lineHeight: 1.6,
                    marginBottom: 4,
                    paddingLeft: 14,
                    borderLeft: '2px solid #1e2330',
                  }}>
                    {pt}
                  </div>
                ))}
              </div>

              {/* Invalidation */}
              <div style={{
                background: '#ff4d4f11',
                border: '1px solid #ff4d4f33',
                borderRadius: 6,
                padding: '8px 14px',
                fontSize: 11,
                fontFamily: 'IBM Plex Mono, monospace',
              }}>
                <span style={{ color: '#ff4d4f', marginRight: 10 }}>✕ INVALIDATION</span>
                <span style={{ color: '#aaa' }}>
                  ${r.invalidationLevel.low.toLocaleString()} – ${r.invalidationLevel.high.toLocaleString()}
                </span>
                <span style={{ color: '#666', marginLeft: 10 }}>{r.invalidationLevel.note}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
