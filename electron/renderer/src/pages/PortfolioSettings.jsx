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
      const result = await window.electron.ipcRenderer.invoke('portfolio:getTypes', {});
      if (result.ok) {
        setPortfolioTypes(result.data);
      }
    } catch (err) {
      console.error('Portfolio types error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-400">Loading portfolio types...</div>;

  const types = Object.entries(portfolioTypes);
  const current = portfolioTypes[selectedType];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Portfolio Type</h2>

      <div className="grid grid-cols-2 gap-4">
        {types.map(([key, pType]) => (
          <div
            key={key}
            onClick={() => setSelectedType(key)}
            className={`p-4 border rounded cursor-pointer transition ${
              selectedType === key
                ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <h3 className="font-bold text-lg">{pType.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{pType.description}</p>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-yellow-400">Risk: {pType.riskTier}</span>
              <span className="text-green-400">Rebalance: {pType.rebalanceFrequency}</span>
            </div>
          </div>
        ))}
      </div>

      {current && (
        <div className="p-6 bg-gray-900 border border-gray-700 rounded space-y-4">
          <h3 className="text-xl font-bold">{current.name} — Constraints</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-800 rounded">
              <p className="text-xs text-gray-400">Max Position Size</p>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {(current.constraints.maxPositionSize * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-3 bg-gray-800 rounded">
              <p className="text-xs text-gray-400">Max Sector Exposure</p>
              <p className="text-xl font-bold text-green-400 mt-1">
                {(current.constraints.maxSectorExposure * 100).toFixed(0)}%
              </p>
            </div>

            <div className="p-3 bg-gray-800 rounded">
              <p className="text-xs text-gray-400">Min Holdings</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">
                {current.constraints.minDiversification}
              </p>
            </div>

            <div className="p-3 bg-gray-800 rounded">
              <p className="text-xs text-gray-400">Max Leverage</p>
              <p className="text-xl font-bold text-red-400 mt-1">
                {current.constraints.maxLeverage.toFixed(1)}x
              </p>
            </div>

            <div className="p-3 bg-gray-800 rounded">
              <p className="text-xs text-gray-400">Min Daily Volume</p>
              <p className="text-xl font-bold text-purple-400 mt-1">
                ${(current.constraints.minLiquidity / 1000000).toFixed(1)}M
              </p>
            </div>

            {current.constraints.minDividendYield && (
              <div className="p-3 bg-gray-800 rounded">
                <p className="text-xs text-gray-400">Min Dividend Yield</p>
                <p className="text-xl font-bold text-indigo-400 mt-1">
                  {(current.constraints.minDividendYield * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
            <p className="text-sm text-blue-300">
              {current.name} is designed for {current.description.toLowerCase()}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-900 border border-gray-700 rounded">
        <h4 className="font-bold mb-2">Strategy Guide</h4>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• <span className="text-yellow-400">Core Growth:</span> Long-term wealth building</li>
          <li>• <span className="text-red-400">High Conviction:</span> Concentrated thesis bets</li>
          <li>• <span className="text-green-400">Hedge:</span> Downside protection portfolio</li>
          <li>• <span className="text-blue-400">Income:</span> Dividend-focused strategy</li>
        </ul>
      </div>
    </div>
  );
}
