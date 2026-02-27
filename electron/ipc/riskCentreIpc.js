import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GOAL_VALUE = 1_000_000;
const GOAL_YEAR  = 2037;

const SECTOR = {
  NVDA:'AI_SEMIS', ASML:'AI_SEMIS', AVGO:'AI_SEMIS',
  MSTR:'CRYPTO_PROXY', BMNR:'CRYPTO_PROXY', APLD:'CRYPTO_PROXY',
  HOOD:'SPECULATIVE',
  NOW:'AI_INFRA',
  BTC:'CRYPTO', ETH:'CRYPTO',
};

const CLUSTERS = [
  { name:'AI Semiconductors',   symbols:['NVDA','ASML','AVGO'],            note:'Core AI chip exposure' },
  { name:'Crypto & Proxies',    symbols:['BTC','ETH','MSTR','BMNR','APLD'], note:'Direct + indirect crypto' },
  { name:'AI Infrastructure',   symbols:['NOW'],                             note:'Cloud + data center' },
  { name:'Growth / Spec',       symbols:['HOOD','CELH','ZETA','AXON'],      note:'High-conviction growth' },
];

// ── Build stress scenarios — drivers are LIVE from positions ────────────────
function buildScenarios(positions, portfolioValue) {
  const bySymbol = {};
  positions.forEach(p => { bySymbol[p.symbol] = p.liveValue ?? 0; });

  const sectorTotals = {};
  positions.forEach(p => {
    const s = SECTOR[p.symbol] ?? 'OTHER';
    sectorTotals[s] = (sectorTotals[s] ?? 0) + (p.liveValue ?? 0);
  });

  const aiSemis     = sectorTotals['AI_SEMIS']      ?? 0;
  const crypto      = (sectorTotals['CRYPTO']        ?? 0) + (sectorTotals['CRYPTO_PROXY'] ?? 0);
  const speculative = sectorTotals['SPECULATIVE']    ?? 0;
  const aiInfra     = sectorTotals['AI_INFRA']       ?? 0;

  // 🔒 Extract actual affected symbols from positions
  const aiSemiSymbols = positions.filter(p => SECTOR[p.symbol] === 'AI_SEMIS').map(p => p.symbol).join(', ') || '—';
  const cryptoSymbols = positions.filter(p => SECTOR[p.symbol] === 'CRYPTO' || SECTOR[p.symbol] === 'CRYPTO_PROXY').map(p => p.symbol).join(', ') || '—';

  return [
    {
      name:         'Tech / AI Selloff (−30%)',
      impactPct:    -((aiSemis * 0.30 + aiInfra * 0.25) / portfolioValue * 100).toFixed(1),
      affectedValue: -(aiSemis * 0.30 + aiInfra * 0.25),
      drivers:      aiSemiSymbols,
    },
    {
      name:         'Crypto Crash (−50%)',
      impactPct:    -((crypto * 0.50) / portfolioValue * 100).toFixed(1),
      affectedValue: -(crypto * 0.50),
      drivers:      cryptoSymbols,
    },
    {
      name:         'Broad Correction (−20%)',
      impactPct:    -20,
      affectedValue: -(portfolioValue * 0.20),
      drivers:      'All positions',
    },
    {
      name:         'AI Sector Rally (+40%)',
      impactPct:    +((aiSemis * 0.40 + aiInfra * 0.35) / portfolioValue * 100).toFixed(1),
      affectedValue: +(aiSemis * 0.40 + aiInfra * 0.35),
      drivers:      aiSemiSymbols,
    },
    {
      name:         'Crypto Bull Run (+100%)',
      impactPct:    +((crypto * 1.00) / portfolioValue * 100).toFixed(1),
      affectedValue: +(crypto * 1.00),
      drivers:      cryptoSymbols,
    },
  ];
}

function computeHHI(positions) {
  const total = positions.reduce((s,p) => s+(p.liveValue??0), 0);
  if (!total) return 0;
  return positions.reduce((sum,p) => { const w=(p.liveValue??0)/total; return sum+w*w; }, 0);
}
function hhiLabel(h) {
  return h<0.15?'DIVERSIFIED':h<0.25?'MODERATE':h<0.40?'CONCENTRATED':'HIGH_CONCENTRATION';
}

function buildConcentrationWarnings(ranked, portfolioValue) {
  const warnings = [];
  ranked.forEach(p => {
    const w = parseFloat(p.weight);
    if (w > 30) warnings.push({ symbol: p.symbol, weight: w, level: 'CRITICAL', message: `${p.symbol} is ${w}% of portfolio — far exceeds 20% single-position limit` });
    else if (w > 20) warnings.push({ symbol: p.symbol, weight: w, level: 'HIGH',     message: `${p.symbol} at ${w}% — consider trimming to below 20%` });
    else if (w > 15) warnings.push({ symbol: p.symbol, weight: w, level: 'MODERATE', message: `${p.symbol} at ${w}% — monitor for further concentration` });
  });
  return warnings;
}

function buildCorrelationClusters(positions, portfolioValue) {
  const bySymbol = {};
  positions.forEach(p => { bySymbol[p.symbol] = p.liveValue ?? 0; });
  const total = portfolioValue || 1;

  return CLUSTERS.map(cl => {
    const clusterValue = cl.symbols.reduce((s, sym) => s + (bySymbol[sym] ?? 0), 0);
    const clusterPct   = (clusterValue / total * 100).toFixed(1);
    const positions_   = cl.symbols
      .filter(sym => bySymbol[sym] > 0)
      .map(sym => ({ symbol: sym, value: bySymbol[sym], weight: (bySymbol[sym]/total*100).toFixed(1) }));
    return {
      name:         cl.name,
      clusterValue,
      clusterPct:   parseFloat(clusterPct),
      note:         cl.note,
      positions:    positions_,
      risk:         parseFloat(clusterPct) > 35 ? 'HIGH' : parseFloat(clusterPct) > 20 ? 'MODERATE' : 'LOW',
    };
  }).filter(cl => cl.clusterValue > 0);
}

function goalMetrics(v) {
  const yr = Math.max(0.01, GOAL_YEAR - new Date().getFullYear());
  return {
    requiredCAGR:   (Math.pow(GOAL_VALUE/v, 1/yr)-1)*100,
    gap:            GOAL_VALUE - v,
    progressPct:    (v/GOAL_VALUE)*100,
    yearsRemaining: yr,
    goalYear:       GOAL_YEAR,
  };
}

function derivePosture({ hhi, heatStatus, concentrationWarnings, requiredCAGR }) {
  const criticalWarnings = concentrationWarnings.filter(w => w.level === 'CRITICAL').length;
  const highWarnings     = concentrationWarnings.filter(w => w.level === 'HIGH').length;

  if (heatStatus === 'OVERHEATED' || criticalWarnings > 0 || hhi > 0.40) return 'TENSE';
  if (heatStatus === 'ELEVATED'   || highWarnings > 0     || hhi > 0.25) return 'ELEVATED';
  if (requiredCAGR > 40) return 'STRETCHED';
  return 'STABLE';
}

export function registerRiskCentreIpc(ipcMain) {
  ipcMain.handle('riskCentre:intelligence:v2', async () => {
    try {
      const { valuePortfolio } = await import("../../engine/portfolio/portfolioValuation.js");
      const holdings           = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../engine/data/users/default/holdings.json"), "utf-8"));
      const valued             = await valuePortfolio(holdings);

      const positions      = valued?.positions ?? [];
      const portfolioValue = valued?.totals?.liveValue ?? positions.reduce((s,p)=>s+(p.liveValue??0),0);
      const total          = portfolioValue || 1;

      let kellyData = null;
      try {
        const { loadHoldings }   = ({ loadHoldings: () => JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../engine/data/users/default/holdings.json"), "utf-8")) });
        const { CONVICTIONS, kellySize, MAX_HEAT_PCT, FRACTIONAL_KELLY } =
          await import("../ipc/kellyDecisionsIpc.js").catch(() => null) ?? {};

        if (CONVICTIONS && kellySize) {
          let totalHeat = 0;
          positions.forEach(pos => {
            const conv = CONVICTIONS[pos.symbol] || { confidence: 'HOLD', conviction: 0.5 };
            const { pct, winProb } = kellySize(conv.confidence, conv.conviction);
            totalHeat += pct * (1 - winProb);
          });
          const isOverheated = totalHeat > MAX_HEAT_PCT;
          kellyData = {
            totalHeat:      +totalHeat.toFixed(2),
            maxAllowedHeat: MAX_HEAT_PCT,
            status:         isOverheated ? 'OVERHEATED' : totalHeat > MAX_HEAT_PCT*0.8 ? 'ELEVATED' : 'NORMAL',
            isOverheated,
          };
        }
      } catch(e) {
        kellyData = null;
      }

      let signalsPressure = 'UNKNOWN';
      let materialSignals = 0;
      let totalSignals    = 0;
      try {
        const { buildSignalsSnapshot } = await import("../../engine/signals/signalsEngine.js");
        const snap = await buildSignalsSnapshot({ positions });
        const sigs = snap?.signals ?? [];
        totalSignals    = sigs.length;
        materialSignals = sigs.filter(s => s.materiality === 'HIGH' || s.materiality === 'MODERATE').length;
        signalsPressure = materialSignals > 3 ? 'ELEVATED' : materialSignals > 0 ? 'MODERATE' : 'NORMAL';
      } catch(e) {
        signalsPressure = 'UNAVAILABLE';
      }

      const hhi    = computeHHI(positions);
      const ranked = [...positions]
        .sort((a,b)=>(b.liveValue??0)-(a.liveValue??0))
        .slice(0,7)
        .map(p=>({ symbol:p.symbol, value:p.liveValue??0, weight:((p.liveValue??0)/total*100).toFixed(1) }));

      const concentrationWarnings = buildConcentrationWarnings(ranked, portfolioValue);
      const correlationClusters   = buildCorrelationClusters(positions, portfolioValue);
      const scenarios             = buildScenarios(positions, portfolioValue);
      const goal                  = portfolioValue > 0 ? goalMetrics(portfolioValue) : null;

      const posture = derivePosture({
        hhi,
        heatStatus:             kellyData?.status ?? 'NORMAL',
        concentrationWarnings,
        requiredCAGR:           goal?.requiredCAGR ?? 0,
      });

      const growthPressure = (goal?.requiredCAGR ?? 0) > 40
        ? 'ELEVATED' : (goal?.requiredCAGR ?? 0) > 28
        ? 'MODERATE' : 'NORMAL';

      return {
        ok:        true,
        timestamp: Date.now(),
        posture,
        portfolioValue,

        drivers: {
          growth: {
            pressure:      growthPressure,
            requiredCAGR:  goal?.requiredCAGR?.toFixed(1),
            classification: growthPressure === 'ELEVATED' ? 'OUT_OF_BOUNDS' : 'FEASIBLE',
          },
          signals: {
            pressure:       signalsPressure,
            materialCount:  materialSignals,
            surfacedCount:  totalSignals,
          },
          heat: kellyData ? {
            status:        kellyData.status,
            totalHeat:     kellyData.totalHeat,
            maxAllowedHeat:kellyData.maxAllowedHeat,
            isOverheated:  kellyData.isOverheated,
          } : null,
        },

        concentration: {
          hhi,
          label:    hhiLabel(hhi),
          top:      ranked,
          warnings: concentrationWarnings,
        },

        correlationClusters,
        scenarios,
        goal,
      };

    } catch(err) {
      console.error('[riskCentre:intelligence:v2]', err);
      return { ok:false, error:err.message };
    }
  });
}
