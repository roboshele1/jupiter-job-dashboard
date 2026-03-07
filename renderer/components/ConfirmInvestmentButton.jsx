import { useState } from 'react';

export default function ConfirmInvestmentButton({ symbol, amount, kellyPct, thesisType, conviction }) {
  const [recorded, setRecorded] = useState(false);

  const handleConfirm = async () => {
    try {
      const result = await window.jupiter.invoke('execution:record', {
        symbol,
        entryPrice: 0,
        kellySize: kellyPct || 19.4,
        thesisType: thesisType || 'GROWTH',
        conviction: conviction || 0.65
      });
      if (result.ok) setRecorded(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  return (
    <button onClick={handleConfirm} disabled={recorded} style={{
      padding: '10px 16px',
      background: recorded ? '#22c55e' : '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      cursor: recorded ? 'default' : 'pointer',
      fontSize: 12,
      fontWeight: 700,
    }}>
      {recorded ? '✓ Recorded to Ledger' : '✓ Confirm & Log Decision'}
    </button>
  );
}
