/**
 * Universe Scheduler
 *
 * Purpose:
 * - Define WHAT Jupiter scans
 * - Define HOW OFTEN scans run
 * - Feed assets into Autonomous Moonshot Scanner continuously
 *
 * This is NOT execution logic.
 * This is NOT UI.
 */

const marketDataAdapter = require('../market/adapters/marketDataAdapter');
const autonomousMoonshotScanner = require('./autonomousMoonshotScanner');

const DEFAULT_UNIVERSE = {
  PRIMARY: {
    description: 'Primary exchange equities (institutional survivability)',
    cadenceMs: 60 * 1000, // 1 minute
    symbols: [] // populated dynamically
  },
  DEEP_ASYMMETRY: {
    description: 'Deep asymmetry assets (OTC, microcaps, distressed)',
    cadenceMs: 5 * 60 * 1000, // 5 minutes
    symbols: [] // populated dynamically
  }
};

/**
 * Load universe symbols
 * (This will later expand to dynamic discovery, ETFs, filings, etc.)
 */
function loadUniverse(regime) {
  if (regime === 'PRIMARY') {
    return [
      'NVDA',
      'AMD',
      'TSLA',
      'META',
      'AAPL'
    ];
  }

  if (regime === 'DEEP_ASYMMETRY') {
    return [
      'RGC',
      'SOUN',
      'ASTS',
      'DNA'
    ];
  }

  return [];
}

/**
 * Run a single scan cycle
 */
async function runScan(regime) {
  const symbols = loadUniverse(regime);
  const assets = [];

  for (const symbol of symbols) {
    try {
      const asset = await marketDataAdapter(symbol);
      asset.regime = regime;
      assets.push(asset);
    } catch (err) {
      console.error(`[UniverseScheduler] Failed to load ${symbol}:`, err.message);
    }
  }

  const results = autonomousMoonshotScanner(assets);

  console.log(
    `[${new Date().toISOString()}] ${regime} SCAN RESULT`,
    JSON.stringify(results, null, 2)
  );

  return results;
}

/**
 * Start continuous scanning
 */
function startScheduler() {
  Object.keys(DEFAULT_UNIVERSE).forEach((regime) => {
    const cadence = DEFAULT_UNIVERSE[regime].cadenceMs;

    console.log(`[UniverseScheduler] Starting ${regime} scans every ${cadence / 1000}s`);

    setInterval(() => {
      runScan(regime);
    }, cadence);
  });
}

module.exports = {
  startScheduler,
  runScan,
  loadUniverse
};
