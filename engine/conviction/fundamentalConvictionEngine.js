/**
 * fundamentalConvictionEngine.js (UPDATED)
 * Institutional conviction scoring — thesis-driven, forward-looking macro
 * 
 * Now uses: VIX, yield curve, breadth, geopolitical risk
 * Instead of: lagging 50/200 MA technicals
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectMacroRegime } from './macroRegimeDetector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THESIS_AUDIT_FILE = path.join(__dirname, '../data/users/default/thesisAudit.json');

const POLYGON_KEY = process.env.POLYGON_API_KEY || 'YnaWTNmcXAkNMDpZTrFqpeLbvxisYOc3';

// ── Macro Regime Confidence (forward-looking: VIX, yield curve, breadth, geopolitical) ──
async function getMacroRegimeConfidence() {
  try {
    const macroRegime = await detectMacroRegime();
    
    // Map regime + signal count to conviction dampening
    // BULL with 0 signals = 0.85 confidence (strong)
    // BULL with 1 signal = 0.65 confidence (caution)
    // SIDEWAYS = 0.55 confidence (distribution)
    // BEAR = 0.35-0.45 confidence (defensive)
    
    const confidenceMap = {
      'BULL': macroRegime.bearishSignalCount === 0 ? 0.85 
        : macroRegime.bearishSignalCount === 1 ? 0.65 
        : 0.55,
      'SIDEWAYS': 0.55,
      'BEAR': 0.35
    };
    
    return {
      regime: macroRegime.regime,
      confidence: confidenceMap[macroRegime.regime] || 0.60,
      signals: macroRegime.signals,
      rationale: macroRegime.rationale,
      details: macroRegime.details
    };
  } catch (err) {
    console.error('[MacroRegime] Error:', err.message);
    return { 
      regime: 'SIDEWAYS', 
      confidence: 0.60, 
      rationale: 'Macro regime neutral (forward-looking data unavailable)',
      signals: {},
      details: null
    };
  }
}

// ── Fetch latest earnings surprise (actual vs consensus) ──────────────────────
async function getEarningsSurprise(symbol) {
  try {
    // Polygon earnings endpoint
    const url = `https://api.polygon.io/v2/reference/company?ticker=${symbol}&apikey=${POLYGON_KEY}`;
    const resp = await axios.get(url, { timeout: 5000 });
    
    if (!resp.data?.results?.length) return null;

    const company = resp.data.results[0];
    
    // Return fundamentals if available
    return {
      symbol,
      lastEarningsDate: company.last_updated,
      description: company.description || null
    };
  } catch (err) {
    console.error(`[Earnings] Failed to fetch ${symbol}:`, err.message);
    return null;
  }
}

// ── Load thesis audit (manual updates per holding) ────────────────────────────
function loadThesisAudit() {
  if (!fs.existsSync(THESIS_AUDIT_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(THESIS_AUDIT_FILE, 'utf8'));
  } catch (err) {
    console.error('[ThesisAudit] Failed to load:', err.message);
    return {};
  }
}

// ── Default thesis health per symbol ─────────────────────────────────────────
const DEFAULT_THESIS_HEALTH = {
  NVDA: {
    thesis: 'AI accelerator dominance, TAM expanding, execution strong',
    moatHealth: 0.90,     // 0-1: competitive moat strength
    executionScore: 0.85, // 0-1: thesis execution vs expectations
    marginTrend: 'expanding', // 'expanding' | 'stable' | 'contracting'
    lastAudit: '2026-03-01'
  },
  ASML: {
    thesis: 'Chip capex cycle intact, TSMC dependency risk moderate',
    moatHealth: 0.80,
    executionScore: 0.75,
    marginTrend: 'stable',
    lastAudit: '2026-03-01'
  },
  AVGO: {
    thesis: 'Broadcom AI datacenter exposed, competition rising',
    moatHealth: 0.75,
    executionScore: 0.70,
    marginTrend: 'contracting',
    lastAudit: '2026-03-01'
  },
  BTC: {
    thesis: 'Institutional adoption, macro hedge, volatility pricing in',
    moatHealth: 0.95,
    executionScore: 0.90,
    marginTrend: 'stable',
    lastAudit: '2026-03-01'
  },
  ETH: {
    thesis: 'DeFi moat, Shanghai upgrade success, L2 competition',
    moatHealth: 0.80,
    executionScore: 0.75,
    marginTrend: 'stable',
    lastAudit: '2026-03-01'
  },
  MSTR: {
    thesis: 'BTC leverage play, macro dependent, execution binary',
    moatHealth: 0.50,
    executionScore: 0.60,
    marginTrend: 'volatile',
    lastAudit: '2026-03-01'
  },
  NOW: {
    thesis: 'ServiceNow TAM, competitive pressure in workflow',
    moatHealth: 0.75,
    executionScore: 0.70,
    marginTrend: 'stable',
    lastAudit: '2026-03-01'
  },
  AXON: {
    thesis: 'AI law enforcement, regulatory scrutiny increasing',
    moatHealth: 0.55,
    executionScore: 0.50,
    marginTrend: 'contracting',
    lastAudit: '2026-03-01'
  },
  ZETA: {
    thesis: 'Data platform, customer churn risk, AI TAM upside',
    moatHealth: 0.65,
    executionScore: 0.65,
    marginTrend: 'stable',
    lastAudit: '2026-03-01'
  },
  MELI: {
    thesis: 'LATAM ecommerce, macro headwinds in region',
    moatHealth: 0.70,
    executionScore: 0.75,
    marginTrend: 'expanding',
    lastAudit: '2026-03-01'
  },
  LLY: {
    thesis: 'GLP-1 dominance, pricing power, pipeline strong',
    moatHealth: 0.92,
    executionScore: 0.90,
    marginTrend: 'expanding',
    lastAudit: '2026-03-01'
  },
  NU: {
    thesis: 'Fintech Brazil, macro sensitivity, local competition',
    moatHealth: 0.45,
    executionScore: 0.40,
    marginTrend: 'contracting',
    lastAudit: '2026-03-01'
  },
  RKLB: {
    thesis: 'Space launch, execution risk, RAW margins pressure',
    moatHealth: 0.55,
    executionScore: 0.50,
    marginTrend: 'contracting',
    lastAudit: '2026-03-01'
  }
};

// ── Compute fundamental conviction ────────────────────────────────────────────
function computeFundamentalConviction(symbol, technicalConviction = 0.5) {
  const audit = loadThesisAudit();
  const thesisData = audit[symbol] || DEFAULT_THESIS_HEALTH[symbol] || {
    moatHealth: 0.6,
    executionScore: 0.6,
    marginTrend: 'stable'
  };

  // Fundamental score components (0-1 each)
  const moatScore = thesisData.moatHealth || 0.6;
  const executionScore = thesisData.executionScore || 0.6;
  
  // Margin trend impact
  const marginBonus = thesisData.marginTrend === 'expanding' ? 0.10
    : thesisData.marginTrend === 'contracting' ? -0.10
    : 0;

  // Weighted fundamental score: 60% (moat + execution + margin)
  const fundamentalScore = (moatScore * 0.4 + executionScore * 0.4 + (0.5 + marginBonus) * 0.2);

  // Blend: 60% fundamental, 40% technical momentum
  const blendedConviction = Math.max(0, Math.min(1,
    (fundamentalScore * 0.60) + (technicalConviction * 0.40)
  ));

  // Confidence tier from blended conviction
  let confidence;
  if (blendedConviction >= 0.80) confidence = 'BUY_MORE';
  else if (blendedConviction >= 0.65) confidence = 'BUY';
  else if (blendedConviction >= 0.45) confidence = 'HOLD';
  else confidence = 'AVOID';

  // Rationale: show what's driving conviction
  const rationale = `Fundamental: Moat ${(moatScore * 100).toFixed(0)}/100 · Execution ${(executionScore * 100).toFixed(0)}/100 · Margins ${thesisData.marginTrend} · Blended: ${(blendedConviction * 100).toFixed(0)}/100`;

  return {
    confidence,
    conviction: Number(blendedConviction.toFixed(3)),
    rationale,
    fundamentalBreakdown: {
      moatHealth: moatScore,
      executionScore: executionScore,
      marginTrend: thesisData.marginTrend,
      fundamentalScore: Number(fundamentalScore.toFixed(3))
    }
  };
}

// ── Main export: blend technical + fundamental ────────────────────────────────
export async function computeFundamentalConvictions(technicalResults = {}) {
  const macro = await getMacroRegimeConfidence();
  const results = {};

  for (const [symbol, technicalData] of Object.entries(technicalResults)) {
    const technicalConviction = technicalData.conviction || 0.5;
    
    // Macro dampen: if macro confidence low, reduce fundamental conviction slightly
    const macroDampener = macro.confidence;
    
    const fundamental = computeFundamentalConviction(symbol, technicalConviction);
    
    // Final conviction: blend fundamental with macro confidence
    const finalConviction = Math.max(0, Math.min(1,
      fundamental.conviction * macroDampener
    ));

    results[symbol] = {
      confidence: fundamental.confidence,
      conviction: Number(finalConviction.toFixed(3)),
      rationale: fundamental.rationale,
      technicalMomentum: technicalConviction,
      fundamentalScore: fundamental.fundamentalBreakdown.fundamentalScore,
      macroConfidence: macroDampener,
      breakdown: {
        moatHealth: fundamental.fundamentalBreakdown.moatHealth,
        executionScore: fundamental.fundamentalBreakdown.executionScore,
        marginTrend: fundamental.fundamentalBreakdown.marginTrend,
        technical: technicalConviction,
        macro: macroDampener
      }
    };
  }

  return { results, macro };
}

// ── Save thesis audit update (call quarterly to update holdings) ──────────────
export function updateThesisAudit(symbol, updates) {
  const audit = loadThesisAudit();
  audit[symbol] = {
    ...(audit[symbol] || DEFAULT_THESIS_HEALTH[symbol] || {}),
    ...updates,
    lastAudit: new Date().toISOString().split('T')[0]
  };
  
  fs.writeFileSync(THESIS_AUDIT_FILE, JSON.stringify(audit, null, 2));
  console.log(`[ThesisAudit] Updated ${symbol}`);
  return audit[symbol];
}

// ── Export for testing ───────────────────────────────────────────────────────
export { DEFAULT_THESIS_HEALTH, getMacroRegimeConfidence };
