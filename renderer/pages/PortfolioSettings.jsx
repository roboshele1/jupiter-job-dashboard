import React, { useState, useEffect } from 'react';

export default function PortfolioSettings() {
  const [selectedType, setSelectedType] = useState('CORE_GROWTH');
  const [portfolioTypes, setPortfolioTypes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioTypes();
  }, []);

  const fetchPortfolioTypes = async () => {
    try {
      const result = await window.jupiter.invoke('portfolio:getTypes', {});
      if (result.ok) {
        setPortfolioTypes(result.data);
      }
    } catch (err) {
      console.error('Portfolio types error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px', color: '#6b7280' }}>Loading portfolio types...</div>;

  const types = Object.entries(portfolioTypes);
  const current = portfolioTypes[selectedType];

  return (
    <div style={{ padding: '24px', fontFamily: "'IBM Plex Mono', monospace" }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: '24px', color: '#e2e8f0' }}>Portfolio Type</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {types.map(([key, pType]) => (
          <div
            key={key}
            onClick={() => setSelectedType(key)}
            style={{
              padding: '16px',
              border: selectedType === key ? '1px solid #3b82f6' : '1px solid #1e2530',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedType === key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>{pType.name}</h3>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: '8px' }}>{pType.description}</p>
            <div style={{ display: 'flex', gap: '12px', fontSize: 10 }}>
              <span style={{ color: '#f59e0b' }}>Risk: {pType.riskTier}</span>
              <span style={{ color: '#22c55e' }}>Rebalance: {pType.rebalanceFrequency}</span>
            </div>
          </div>
        ))}
      </div>

      {current && (
        <div style={{ padding: '16px', border: '1px solid #1e2530', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: '16px', color: '#e2e8f0' }}>{current.name} — Constraints</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
              <p style={{ fontSize: 10, color: '#6b7280', marginBottom: '4px' }}>Max Position Size</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{(current.constraints.maxPositionSize * 100).toFixed(0)}%</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px' }}>
              <p style={{ fontSize: 10, color: '#6b7280', marginBottom: '4px' }}>Max Sector Exposure</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{(current.constraints.maxSectorExposure * 100).toFixed(0)}%</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
              <p style={{ fontSize: 10, color: '#6b7280', marginBottom: '4px' }}>Min Holdings</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{current.constraints.minDiversification}</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              <p style={{ fontSize: 10, color: '#6b7280', marginBottom: '4px' }}>Max Leverage</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{current.constraints.maxLeverage.toFixed(1)}x</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
