/**
 * monteCarloEngine.js
 * Core Monte Carlo simulation for portfolio probability analysis
 * 
 * Inputs:
 *   - Current portfolio value
 *   - Holdings with individual volatilities (derived from historical returns)
 *   - Monthly DCA amount
 *   - Target value ($1M) and time horizon (10.8 years)
 * 
 * Outputs:
 *   - 10,000 simulation paths
 *   - Probability of hitting $1M
 *   - Percentile outcomes (10th, 25th, 50th, 75th, 90th)
 *   - Drawdown resilience (worst-case path)
 */

// Asset volatility estimates (annualized) — derived from conviction tier
// Lower conviction = higher volatility (more noise)
const VOLATILITY_BY_CAGR = {
  45: 0.65,  // PLTR — high growth, high vol
  40: 0.62,  // APP
  38: 0.68,  // RKLB
  30: 0.48,  // AVGO
  28: 0.52,  // NVDA, NU
  25: 0.50,  // AXON, MELI
  23: 0.45,  // LLY
  22: 0.48,  // NOW
  21: 0.45,  // ZETA
  20: 0.60,  // BTC — crypto volatility
  18: 0.55,  // MSTR
  15: 0.40,  // ASML, ETH
};

function getVolatilityForCAGR(cagr) {
  // Find closest CAGR in table
  const keys = Object.keys(VOLATILITY_BY_CAGR).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - cagr) < Math.abs(prev - cagr) ? curr : prev
  );
  return VOLATILITY_BY_CAGR[closest] || 0.50;
}

/**
 * Normal distribution random variable (Box-Muller)
 */
function randomNormal() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Simulate one portfolio path over N months
 * @param {Object} config - { startValue, holdings, monthlyDCA, monthsToRun, targetReturn }
 * @returns {Object} - { finalValue, path, minValue, maxValue, worstDrawdown }
 */
function simulatePath({ startValue, holdings, monthlyDCA, monthsToRun, targetReturn }) {
  let value = startValue;
  const path = [value];
  let minValue = value;
  let maxValue = value;
  let worstDrawdown = 0;

  // Portfolio weights (from current positions)
  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0) || 1;
  const weights = holdings.map(h => (h.weight || 0) / totalWeight);

  // Monthly conversion
  const monthlyReturn = (targetReturn || 0.27) / 12 / 100; // e.g., 27% annual → 2.25% monthly
  const monthlyVolatility = Math.sqrt(
    weights.reduce((s, w, i) => {
      const vol = getVolatilityForCAGR(holdings[i].cagr || 20);
      return s + w * w * (vol * vol);
    }, 0)
  ) / Math.sqrt(12); // Monthly vol from annual

  for (let month = 0; month < monthsToRun; month++) {
    // Stochastic return: drift + random shock
    const driftComponent = monthlyReturn;
    const shockComponent = monthlyVolatility * randomNormal();
    const monthlyMultiplier = 1 + driftComponent + shockComponent;

    // Apply market return + add DCA
    value = value * monthlyMultiplier + monthlyDCA;

    // Track metrics
    path.push(value);
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;

    // Drawdown from peak
    const peakValue = Math.max(...path.slice(0, month + 1));
    const dd = peakValue > 0 ? (peakValue - value) / peakValue : 0;
    if (dd > worstDrawdown) worstDrawdown = dd;
  }

  return { finalValue: value, path, minValue, maxValue, worstDrawdown };
}

/**
 * Run full Monte Carlo simulation
 * @param {Object} config - { startValue, holdings, monthlyDCA, targetValue, years, simCount }
 * @returns {Object} - results with statistics
 */
export function runMonteCarloSimulation(config) {
  const {
    startValue = 74232,
    holdings = [],
    monthlyDCA = 500,
    targetValue = 1_000_000,
    years = 10.8,
    simCount = 10000,
    targetReturn = 27.3, // Required CAGR in %
  } = config;

  const monthsToRun = Math.round(years * 12);
  const simulations = [];

  // Run N simulations
  for (let i = 0; i < simCount; i++) {
    const result = simulatePath({
      startValue,
      holdings,
      monthlyDCA,
      monthsToRun,
      targetReturn,
    });
    simulations.push(result);
  }

  // Extract final values
  const finalValues = simulations.map(s => s.finalValue).sort((a, b) => a - b);
  const hitsTarget = finalValues.filter(v => v >= targetValue).length;
  const probabilityOfSuccess = (hitsTarget / simCount) * 100;

  // Percentiles
  const percentile = (p) => {
    const idx = Math.floor((p / 100) * finalValues.length);
    return finalValues[Math.min(idx, finalValues.length - 1)];
  };

  // Worst-case drawdown across all sims
  const worstDrawdowns = simulations.map(s => s.worstDrawdown);
  const avgWorstDrawdown = worstDrawdowns.reduce((s, d) => s + d, 0) / worstDrawdowns.length;
  const maxDrawdown = Math.max(...worstDrawdowns);

  // Return distribution histogram (10 buckets)
  const histogram = Array(10).fill(0);
  const minOutcome = finalValues[0];
  const maxOutcome = finalValues[finalValues.length - 1];
  const bucketSize = (maxOutcome - minOutcome) / 10;
  finalValues.forEach(v => {
    const bucketIdx = Math.min(9, Math.floor((v - minOutcome) / bucketSize));
    histogram[bucketIdx]++;
  });

  return {
    // Summary stats
    simulationCount: simCount,
    probabilityOfSuccess,
    expectedFinalValue: finalValues.reduce((s, v) => s + v, 0) / simCount,
    
    // Percentile outcomes
    percentile10: percentile(10),
    percentile25: percentile(25),
    percentile50: percentile(50),
    percentile75: percentile(75),
    percentile90: percentile(90),

    // Risk metrics
    minOutcome: minOutcome,
    maxOutcome: maxOutcome,
    averageWorstDrawdown: avgWorstDrawdown,
    maxDrawdown: maxDrawdown,

    // Distribution
    histogram,
    bucketMin: minOutcome,
    bucketMax: maxOutcome,
    bucketSize,

    // Raw data for advanced analysis
    finalValues,
    simulations, // Full path data if needed
    targetValue,
    yearsToTarget: years,
  };
}

/**
 * Generate percentile bands for visualization
 * @param {Array} simulations - Raw simulations with .path property
 * @returns {Object} - { p10, p25, p50, p75, p90 } with monthly values
 */
export function generatePercentileBands(simulations) {
  if (!simulations || simulations.length === 0) return null;

  const pathLength = simulations[0].path.length;
  const bands = { p10: [], p25: [], p50: [], p75: [], p90: [] };

  for (let month = 0; month < pathLength; month++) {
    const monthValues = simulations.map(s => s.path[month]).sort((a, b) => a - b);
    const n = monthValues.length;

    bands.p10.push(monthValues[Math.floor(n * 0.10)]);
    bands.p25.push(monthValues[Math.floor(n * 0.25)]);
    bands.p50.push(monthValues[Math.floor(n * 0.50)]);
    bands.p75.push(monthValues[Math.floor(n * 0.75)]);
    bands.p90.push(monthValues[Math.floor(n * 0.90)]);
  }

  return bands;
}

/**
 * Calculate sensitivity analysis across DCA amounts
 * Faster version: 1000 sims per amount
 */
export function sensitivityAnalysis(baseConfig, dcaRange = [300, 500, 750, 1000, 1500]) {
  const results = {};

  dcaRange.forEach(dca => {
    const result = runMonteCarloSimulation({
      ...baseConfig,
      monthlyDCA: dca,
      simCount: 1000, // Faster for sensitivity
    });
    results[dca] = {
      dca,
      probability: result.probabilityOfSuccess,
      median: result.percentile50,
      p90: result.percentile90,
    };
  });

  return results;
}
