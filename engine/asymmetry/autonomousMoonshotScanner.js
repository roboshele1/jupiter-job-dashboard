/**
 * Autonomous Moonshot Scanner — V2
 * Regime-aware, asymmetry-first, deterministic.
 * Now wired to live Market Monitor regime signal.
 * Universe pulled from Polygon grouped daily — no hardcoded symbols.
 */

const https = require("https");
const regimeClassifier         = require('./regimeClassifier');
const aggregateScore           = require('./asymmetryScoreAggregator');
const capitalFlowDetector      = require('./signals/capitalFlowDetector');
const volatilityCompressionEngine = require('./signals/volatilityCompressionEngine');
const survivabilityGate        = require('./signals/survivabilityGate');
const structuralCatalystDetector  = require('./signals/structuralCatalystDetector');
const narrativeDissonanceDetector = require('./signals/narrativeDissonanceDetector');
const optionalMomentumIgnition = require('./signals/optionalMomentumIgnition');

const POLYGON_KEY = process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";
const MIN_PRICE   = 5;
const MIN_VOLUME  = 1_000_000; // higher bar for moonshots — needs liquidity
const MAX_CANDIDATES = 200;

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

function getPrevBusinessDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// Pull regime signal from Market Monitor if available
async function getLiveRegimeSignal() {
  try {
    // Fetch SPY + sector breadth to derive regime
    const date = getPrevBusinessDate();
    const sectorETFs = ["XLK","XLF","XLV","XLE","XLI","XLP","XLU","XLRE"];
    const [spyBar, ...sectorBars] = await Promise.all([
      fetchJson(`https://api.polygon.io/v2/aggs/ticker/SPY/prev?adjusted=true&apiKey=${POLYGON_KEY}`),
      ...sectorETFs.map(s => fetchJson(`https://api.polygon.io/v2/aggs/ticker/${s}/prev?adjusted=true&apiKey=${POLYGON_KEY}`)),
    ]);

    const spy = spyBar?.results?.[0];
    const spyMomentum = spy ? ((spy.c - spy.o) / spy.o) * 100 : null;
    const aboveOpen   = sectorBars.filter(b => b?.results?.[0]?.c > b?.results?.[0]?.o).length;
    const breadthPct  = Math.round((aboveOpen / sectorETFs.length) * 100);

    if (breadthPct >= 65 && spyMomentum > 0)      return "RISK_ON";
    if (breadthPct <= 40 && spyMomentum < 0)       return "RISK_OFF";
    if (breadthPct >= 55)                          return "MILD_RISK_ON";
    if (breadthPct <= 45)                          return "MILD_RISK_OFF";
    return "NEUTRAL";
  } catch {
    return "NEUTRAL";
  }
}

// Pull full market universe from Polygon — no hardcoded symbols
async function buildMoonshotUniverse() {
  const date = getPrevBusinessDate();
  try {
    const resp = await fetchJson(
      `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${POLYGON_KEY}`
    );
    const all = resp?.results || [];

    // Moonshot filter: higher liquidity, meaningful price, short ticker (no ETFs/warrants)
    const filtered = all.filter(t =>
      t.c >= MIN_PRICE &&
      t.v >= MIN_VOLUME &&
      t.T &&
      !t.T.includes(".") &&
      t.T.length <= 5
    );

    // Score by absolute momentum — biggest movers are moonshot candidates
    const scored = filtered.map(t => ({
      symbol:   t.T,
      price:    t.c,
      volume:   t.v,
      momentum: t.o > 0 ? (t.c - t.o) / t.o : 0,
      high:     t.h,
      low:      t.l,
      open:     t.o,
      close:    t.c,
    })).sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum));

    return scored.slice(0, MAX_CANDIDATES);
  } catch {
    return [];
  }
}

module.exports = async function autonomousMoonshotScanner(universe = []) {
  // If no universe provided, build from live market data
  const candidates = universe.length > 0 ? universe : await buildMoonshotUniverse();

  // Get live regime signal
  const liveRegime = await getLiveRegimeSignal();

  const surfaced = [];
  const latent   = [];
  const rejected = [];

  for (const asset of candidates) {
    // Enrich asset with live regime
    const regimeResult   = regimeClassifier(asset);
    const assetRegime    = regimeResult.regime || liveRegime;
    const enrichedAsset  = { ...asset, regime: assetRegime, liveRegime };

    const capitalFlow         = capitalFlowDetector(enrichedAsset);
    const volatilityState     = volatilityCompressionEngine(enrichedAsset);
    const survivability       = survivabilityGate(enrichedAsset);
    const structuralCatalyst  = structuralCatalystDetector(enrichedAsset);
    const narrativeDissonance = narrativeDissonanceDetector(enrichedAsset);
    const momentum            = optionalMomentumIgnition(enrichedAsset);

    const signals = {
      capitalFlow, volatilityState, survivability,
      structuralCatalyst, narrativeDissonance,
      optionalMomentumIgnition: momentum,
    };

    const aggregated = aggregateScore(signals);

    if (aggregated.disqualified) {
      rejected.push({
        symbol: asset.symbol,
        regime: assetRegime,
        liveRegime,
        status: 'REJECTED',
        disqualificationReasons: aggregated.reasons || ['Disqualified'],
        signalBreakdown: extractScores(signals),
        asymmetryScore: aggregated.score || 0,
      });
      continue;
    }

    if (aggregated.tier === 'ELITE' || aggregated.tier === 'SURFACED') {
      surfaced.push(buildResult(asset, assetRegime, liveRegime, aggregated, signals));
    } else if (aggregated.tier === 'LATENT') {
      latent.push(buildResult(asset, assetRegime, liveRegime, aggregated, signals));
    } else {
      rejected.push({
        symbol: asset.symbol,
        regime: assetRegime,
        liveRegime,
        status: 'REJECTED',
        disqualificationReasons: ['Score below asymmetry threshold'],
        signalBreakdown: extractScores(signals),
        asymmetryScore: aggregated.score || 0,
      });
    }
  }

  return {
    engine:        'AutonomousMoonshotScanner_V2',
    evaluated:     candidates.length,
    surfacedCount: surfaced.length,
    latentCount:   latent.length,
    liveRegime,
    timestamp:     new Date().toISOString(),
    surfaced,
    latent,
    rejected,
  };
};

function extractScores(signals) {
  return {
    capitalFlow:              signals.capitalFlow.score              || 0,
    volatilityState:          signals.volatilityState.score          || 0,
    survivability:            signals.survivability.score            || 0,
    structuralCatalyst:       signals.structuralCatalyst.score       || 0,
    narrativeDissonance:      signals.narrativeDissonance.score      || 0,
    optionalMomentumIgnition: signals.optionalMomentumIgnition.score || 0,
  };
}

function buildResult(asset, regime, liveRegime, aggregated, signals) {
  return {
    symbol:         asset.symbol,
    price:          asset.price,
    momentum:       Math.round(asset.momentum * 10000) / 100,
    volume:         asset.volume,
    regime,
    liveRegime,
    status:         aggregated.tier,
    asymmetryScore: aggregated.score,
    signalBreakdown: extractScores(signals),
    lastEvaluated:  new Date().toISOString(),
  };
}
