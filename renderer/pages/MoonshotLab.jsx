/**
 * MOONSHOT LAB — Pre-Breakout Compounder Identifier
 * Persistent background screening with clear status
 */

import React, { useState, useEffect, useRef } from 'react';

const C = {
  bg: '#060910',
  panel: '#0f172a',
  border: '#1e2530',
  text: '#e2e8f0',
  textMuted: '#64748b',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export default function MoonshotLab() {
  const [screenResults, setScreenResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, screening, complete, error
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const screeningRef = useRef(null);

  const runScreening = async () => {
    // Prevent multiple simultaneous screenings
    if (status === 'screening') return;

    setStatus('screening');
    setStatusMessage('Initializing screening...');
    setScreenResults([]);

    try {
      const screenerSymbols = ['TSLA', 'NFLX', 'AMZN', 'UPST', 'CRWD', 'DDOG', 'NET', 'ARM', 'CDNS'];

      setStatusMessage(`Screening ${screenerSymbols.length} stocks for moonshot characteristics...`);

      const profiles = [
        {
          name: 'NVDA-like',
          revenueCAGR: 0.35,
          marginExpansion: 0.08,
          growthConsistency: 0.85
        }
      ];

      // Run screening with timeout
      screeningRef.current = new AbortController();
      
      const results = await window.jupiter.invoke('moonshot:screen', {
        symbols: screenerSymbols,
        profiles,
        options: {
          minTrajectoryScore: 60,
          minRevenueCAGR: 0.25,
          marketCapMin: 1e9,
          marketCapMax: 100e9
        }
      });

      if (results?.ok) {
        const candidates = results.data || [];
        setScreenResults(candidates);

        if (candidates.length === 0) {
          setStatus('complete');
          setStatusMessage('✓ Screening complete. No moonshot candidates found matching current criteria.');
        } else {
          setStatus('complete');
          setStatusMessage(`✓ Screening complete. Found ${candidates.length} moonshot candidate(s).`);
        }
      } else {
        setStatus('error');
        setStatusMessage(`✗ Screening failed: ${results?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage(`✗ Screening error: ${err.message}`);
      console.error('Moonshot error:', err);
    }
  };

  // Auto-run screening on component mount
  useEffect(() => {
    runScreening();
  }, []);

  return (
    <div style={{ padding: 24, background: C.bg, minHeight: '100vh', fontFamily: mono.fontFamily, color: C.text }}>
      {/* Header */}
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>◈ MOONSHOT LAB</h1>
      <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 24 }}>
        Pre-breakout compounders matching your portfolio's winning growth DNA
      </p>

      {/* Status Banner */}
      <div style={{
        padding: 16,
        background: status === 'screening' ? 'rgba(59, 130, 246, 0.1)' : 
                    status === 'complete' ? 'rgba(34, 197, 94, 0.1)' : 
                    status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
        border: `1px solid ${
          status === 'screening' ? C.blue :
          status === 'complete' ? C.green :
          status === 'error' ? C.red : C.border
        }`,
        borderRadius: 8,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {status === 'screening' && (
          <>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: C.blue,
              animation: 'pulse 1s infinite',
            }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                Screening in progress...
              </p>
              <p style={{ fontSize: 11, color: C.textMuted }}>
                {statusMessage}
              </p>
            </div>
          </>
        )}

        {status === 'complete' && (
          <>
            <span style={{ fontSize: 18 }}>✓</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 4 }}>
                Screening Complete
              </p>
              <p style={{ fontSize: 11, color: C.textMuted }}>
                {statusMessage}
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <span style={{ fontSize: 18 }}>✗</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.red, marginBottom: 4 }}>
                Screening Failed
              </p>
              <p style={{ fontSize: 11, color: C.textMuted }}>
                {statusMessage}
              </p>
            </div>
          </>
        )}

        {status === 'idle' && (
          <p style={{ fontSize: 11, color: C.textMuted }}>Ready to screen</p>
        )}
      </div>

      {/* Controls */}
      <button
        onClick={runScreening}
        disabled={status === 'screening'}
        style={{
          padding: '10px 16px',
          background: status === 'screening' ? '#4b5563' : C.blue,
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: status === 'screening' ? 'not-allowed' : 'pointer',
          fontFamily: mono.fontFamily,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 24,
          opacity: status === 'screening' ? 0.6 : 1,
        }}
      >
        {status === 'screening' ? 'Screening in progress...' : 'Run Screening Again'}
      </button>

      {/* Results Grid */}
      {screenResults.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.text }}>
            Candidates ({screenResults.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {screenResults.map((c) => (
              <div
                key={c.symbol}
                onClick={() => setSelectedCandidate(c)}
                style={{
                  padding: 16,
                  background: C.panel,
                  border: selectedCandidate?.symbol === c.symbol ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{c.symbol}</p>
                <div style={{ padding: 8, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 6, marginBottom: 12 }}>
                  <p style={{ fontSize: 9, color: C.textMuted, marginBottom: 4 }}>TRAJECTORY SCORE</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: C.green }}>{c.growth.trajectoryScore}</p>
                </div>
                <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Revenue CAGR: {c.growth.revenueCAGR}</p>
                <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 8 }}>3x in 24m: {c.targets.prob3x}</p>
                <p style={{ fontSize: 9, color: C.amber, fontWeight: 600 }}>Click for details →</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedCandidate && (
        <div style={{ marginTop: 32, padding: 20, background: C.panel, borderRadius: 8, border: `2px solid ${C.blue}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            {selectedCandidate.symbol} — Moonshot Analysis
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Company</p>
              <p style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{selectedCandidate.name}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Current Price</p>
              <p style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>${selectedCandidate.currentPrice?.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Market Cap</p>
              <p style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>${(selectedCandidate.marketCap / 1e9).toFixed(1)}B</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>PE Ratio</p>
              <p style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{selectedCandidate.peRatio?.toFixed(1) || 'N/A'}</p>
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>WHY THIS STOCK?</h4>
            <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              Matches your portfolio's growth profile with <span style={{ color: C.green, fontWeight: 600 }}>{selectedCandidate.growth.trajectoryScore}</span> trajectory score.
              Growing revenue at <span style={{ color: C.green, fontWeight: 600 }}>{selectedCandidate.growth.revenueCAGR}</span> CAGR with <span style={{ color: C.green, fontWeight: 600 }}>{selectedCandidate.growth.marginExpansion}</span> margin expansion.
              {' '}
              <span style={{ color: C.amber, fontWeight: 600 }}>{selectedCandidate.targets.prob3x}</span> probability of 3x return in 24 months if thesis plays out.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
