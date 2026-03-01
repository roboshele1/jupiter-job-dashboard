import React, { useState, useEffect } from 'react';

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Mock portfolio value history (100 days)
      const portfolioValue = Array.from({ length: 100 }, (_, i) => 83000 + i * 25 + Math.random() * 500);
      
      // Mock price histories
      const priceHistories = {
        NVDA: Array.from({ length: 100 }, (_, i) => 800 + i * 0.75 + Math.random() * 50),
        ASML: Array.from({ length: 100 }, (_, i) => 600 + i * 0.5 + Math.random() * 30),
        BTC: Array.from({ length: 100 }, (_, i) => 90000 + i * 50 + Math.random() * 3000),
      };

      const result = await window.electron.ipcRenderer.invoke('portfolio:analyzeMetrics', {
        portfolioValue,
        holdings: [],
        priceHistories,
      });

      if (result.ok) {
        setMetrics(result.data);
      }
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-400">Loading analytics...</div>;
  if (!metrics) return <div className="p-4 text-red-400">Failed to load metrics</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Portfolio Analytics</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-900 border border-blue-500 rounded">
          <p className="text-xs text-blue-300 uppercase">Sharpe Ratio</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{metrics.sharpeRatio}</p>
          <p className="text-xs text-blue-300 mt-2">Risk-adjusted return</p>
        </div>

        <div className="p-4 bg-green-900 border border-green-500 rounded">
          <p className="text-xs text-green-300 uppercase">Sortino Ratio</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{metrics.sortinoRatio}</p>
          <p className="text-xs text-green-300 mt-2">Downside risk only</p>
        </div>

        <div className="p-4 bg-yellow-900 border border-yellow-500 rounded">
          <p className="text-xs text-yellow-300 uppercase">Volatility (Annual)</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{metrics.volatility}</p>
          <p className="text-xs text-yellow-300 mt-2">Standard deviation</p>
        </div>

        <div className="p-4 bg-red-900 border border-red-500 rounded">
          <p className="text-xs text-red-300 uppercase">Max Drawdown</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{metrics.maxDrawdown}</p>
          <p className="text-xs text-red-300 mt-2">Peak-to-trough</p>
        </div>

        <div className="p-4 bg-purple-900 border border-purple-500 rounded">
          <p className="text-xs text-purple-300 uppercase">Calmar Ratio</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">{metrics.calmarRatio}</p>
          <p className="text-xs text-purple-300 mt-2">Return / Max DD</p>
        </div>

        <div className="p-4 bg-indigo-900 border border-indigo-500 rounded">
          <p className="text-xs text-indigo-300 uppercase">Total Return</p>
          <p className="text-3xl font-bold text-indigo-400 mt-2">{metrics.totalReturn}</p>
          <p className="text-xs text-indigo-300 mt-2">Period gain</p>
        </div>
      </div>

      <div className="p-4 bg-gray-900 border border-gray-700 rounded">
        <h3 className="font-bold mb-3">Interpretation</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p><span className="text-green-400">Sharpe > 1.0:</span> Good risk-adjusted returns</p>
          <p><span className="text-green-400">Sortino > 1.0:</span> Strong downside protection</p>
          <p><span className="text-green-400">Calmar > 2.0:</span> Efficient recovery from drawdowns</p>
        </div>
      </div>
    </div>
  );
}
