/**
 * Autonomous Moonshot Scanner
 * Regime-aware, asymmetry-first, deterministic
 */

const regimeClassifier = require('./regimeClassifier');
const aggregateScore = require('./asymmetryScoreAggregator');

const capitalFlowDetector = require('./signals/capitalFlowDetector');
const volatilityCompressionEngine = require('./signals/volatilityCompressionEngine');
const survivabilityGate = require('./signals/survivabilityGate');
const structuralCatalystDetector = require('./signals/structuralCatalystDetector');
const narrativeDissonanceDetector = require('./signals/narrativeDissonanceDetector');
const optionalMomentumIgnition = require('./signals/optionalMomentumIgnition');

module.exports = function autonomousMoonshotScanner(universe = []) {
  const surfaced = [];
  const latent = [];
  const rejected = [];

  for (const asset of universe) {
    // 1. REGIME CLASSIFICATION
    const regimeResult = regimeClassifier(asset);
    const regime = regimeResult.regime;

    // Inject regime into asset for downstream engines
    const enrichedAsset = { ...asset, regime };

    // 2. SIGNALS
    const capitalFlow = capitalFlowDetector(enrichedAsset);
    const volatilityState = volatilityCompressionEngine(enrichedAsset);
    const survivability = survivabilityGate(enrichedAsset);
    const structuralCatalyst = structuralCatalystDetector(enrichedAsset);
    const narrativeDissonance = narrativeDissonanceDetector(enrichedAsset);
    const momentum = optionalMomentumIgnition(enrichedAsset);

    const signals = {
      capitalFlow,
      volatilityState,
      survivability,
      structuralCatalyst,
      narrativeDissonance,
      optionalMomentumIgnition: momentum
    };

    // 3. AGGREGATION
    const aggregated = aggregateScore(signals);

    // 4. DISQUALIFICATION
    if (aggregated.disqualified) {
      rejected.push({
        symbol: asset.symbol,
        regime,
        status: 'REJECTED',
        disqualificationReasons: aggregated.reasons || ['Disqualified'],
        signalBreakdown: extractScores(signals),
        asymmetryScore: aggregated.score || 0
      });
      continue;
    }

    // 5. CLASSIFICATION
    if (aggregated.tier === 'ELITE' || aggregated.tier === 'SURFACED') {
      surfaced.push(buildResult(asset, regime, aggregated, signals));
    } else if (aggregated.tier === 'LATENT') {
      latent.push(buildResult(asset, regime, aggregated, signals));
    } else {
      rejected.push({
        symbol: asset.symbol,
        regime,
        status: 'REJECTED',
        disqualificationReasons: ['Score below asymmetry threshold'],
        signalBreakdown: extractScores(signals),
        asymmetryScore: aggregated.score || 0
      });
    }
  }

  return {
    engine: 'AutonomousMoonshotScanner',
    evaluated: universe.length,
    surfacedCount: surfaced.length,
    latentCount: latent.length,
    timestamp: new Date().toISOString(),
    surfaced,
    latent,
    rejected
  };
};

function extractScores(signals) {
  return {
    capitalFlow: signals.capitalFlow.score || 0,
    volatilityState: signals.volatilityState.score || 0,
    survivability: signals.survivability.score || 0,
    structuralCatalyst: signals.structuralCatalyst.score || 0,
    narrativeDissonance: signals.narrativeDissonance.score || 0,
    optionalMomentumIgnition: signals.optionalMomentumIgnition.score || 0
  };
}

function buildResult(asset, regime, aggregated, signals) {
  return {
    symbol: asset.symbol,
    regime,
    status: aggregated.tier,
    asymmetryScore: aggregated.score,
    signalBreakdown: extractScores(signals),
    lastEvaluated: new Date().toISOString()
  };
}
