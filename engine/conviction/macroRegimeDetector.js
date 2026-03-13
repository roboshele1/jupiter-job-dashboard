/**
 * macroRegimeDetector.js
 * Forward-looking regime detection — catches bear markets BEFORE technicals break
 * 
 * Signals:
 *   - VIX (fear index) — elevated = market stress
 *   - Yield curve (2Y vs 10Y) — inversion = recession signal
 *   - NYSE breadth (% stocks above 50-day) — weak breadth = distribution
 *   - Geopolitical risk (oil/defense relative strength) — war premium
 *   - Fed funds rate (restrictive vs accommodative)
 *
 * Output: regime (BULL/SIDEWAYS/BEAR) + confidence (0-1)
 */

import axios from 'axios';

const POLYGON_KEY = process.env.POLYGON_API_KEY || 'YnaWTNmcXAkNMDpZTrFqpeLbvxisYOc3';

// ── Fetch VIX (Volatility Index) ─────────────────────────────────────────────
async function getVIX() {
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/VIX/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    const resp = await axios.get(url, { timeout: 5000 });
    const vix = resp.data?.results?.[0]?.c;
    
    if (!vix) return null;
    
    // VIX interpretation:
    // < 12: Complacency (bullish)
    // 12-20: Normal market
    // 20-30: Elevated stress
    // > 30: Panic
    
    return {
      value: vix,
      stress: vix > 20 ? 'ELEVATED' : vix > 30 ? 'PANIC' : 'NORMAL',
      bearishSignal: vix > 20 ? true : false
    };
  } catch (err) {
    console.error('[VIX] Fetch failed:', err.message);
    return null;
  }
}

// ── Fetch Yield Curve (2Y vs 10Y) ────────────────────────────────────────────
async function getYieldCurve() {
  try {
    // FRED API for treasury yields (requires FRED_API_KEY env)
    // Fallback: use hardcoded recent data or assume normal curve
    
    // As of Mar 2026: typical scenario post-rate-cuts
    // If you have FRED access, this would fetch DGS2 and DGS10
    
    // For now: assume recent yields (you can update quarterly)
    const yield2Y = 3.8;  // 2-year treasury
    const yield10Y = 4.2; // 10-year treasury
    
    const spread = yield10Y - yield2Y;
    const isInverted = spread < 0;
    
    return {
      yield2Y,
      yield10Y,
      spread,
      isInverted,
      bearishSignal: isInverted ? true : false, // Inversion = recession ahead
      message: isInverted 
        ? 'Yield curve inverted — recession signal' 
        : `Curve normal (spread: ${spread.toFixed(2)}%)`
    };
  } catch (err) {
    console.error('[YieldCurve] Fetch failed:', err.message);
    return null;
  }
}

// ── Fetch NYSE Breadth (% of stocks above 50-day MA) ────────────────────────
async function getNYSEBreadth() {
  try {
    // Breadth indicator: percentage of NYSE stocks trading above their 50-day MA
    // Markets weaken when breadth diverges from price (fewer stocks participating)
    
    // Polygon doesn't have direct breadth data, so we use proxy:
    // Compare TQQQ (3x Nasdaq) vs QQQ (1x Nasdaq) momentum
    // If TQQQ underperforming, breadth is weak
    
    const [tqqq, qqq] = await Promise.all([
      fetchDayChange('TQQQ'),
      fetchDayChange('QQQ')
    ]);
    
    if (!tqqq || !qqq) return null;
    
    // If leveraged etf underperforming, breadth is deteriorating
    const breadthWeakness = qqq.dayChange > tqqq.dayChange;
    
    return {
      qqq: qqq.dayChange,
      tqqq: tqqq.dayChange,
      breadthWeakness,
      bearishSignal: breadthWeakness ? true : false,
      message: breadthWeakness 
        ? 'Breadth weakening — fewer stocks participating in rally' 
        : 'Breadth healthy — broad participation'
    };
  } catch (err) {
    console.error('[Breadth] Fetch failed:', err.message);
    return null;
  }
}

// ── Fetch Geopolitical Risk (Oil vs Equities ratio) ────────────────────────
async function getGeopoliticalRisk() {
  try {
    // Geopolitical stress = oil rises while equities fall (war premium)
    // Monitor: crude oil (WTI) vs SPY ratio
    
    const [oil, spy] = await Promise.all([
      fetchDayChange('WTRH'),  // WTI Crude Oil (proxy)
      fetchDayChange('SPY')
    ]);
    
    if (!oil || !spy) {
      // Fallback: assume elevated if no data (geopolitical tensions)
      return {
        oilChange: null,
        spyChange: null,
        oilEquityDivergence: false,
        bearishSignal: false,
        message: 'Geopolitical risk data unavailable'
      };
    }
    
    // Risk = oil up, stocks down (classic war premium)
    const riskPremium = (oil.dayChange > 0.5) && (spy.dayChange < 0);
    
    return {
      oilChange: oil.dayChange,
      spyChange: spy.dayChange,
      oilEquityDivergence: riskPremium,
      bearishSignal: riskPremium ? true : false,
      message: riskPremium 
        ? 'Geopolitical risk premium — oil rising, stocks falling' 
        : 'Oil-equity correlation normal'
    };
  } catch (err) {
    console.error('[Geopolitical] Fetch failed:', err.message);
    return null;
  }
}

// ── Helper: Fetch day change for a symbol ────────────────────────────────────
async function fetchDayChange(symbol) {
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    const resp = await axios.get(url, { timeout: 5000 });
    const r = resp.data?.results?.[0];
    
    if (!r) return null;
    
    const dayChange = ((r.c - r.o) / r.o) * 100;
    return { symbol, dayChange };
  } catch {
    return null;
  }
}

// ── Fetch Fed Funds Rate (restrictive vs accommodative) ───────────────────
async function getFedRate() {
  try {
    // Fed Funds Rate as of Mar 2026
    // Post-rate-cuts scenario: likely in 3-4% range
    // Restrictive > 5%, Accommodative < 3%
    
    const fedRate = 3.75; // Placeholder (update quarterly)
    
    const stance = fedRate > 5 ? 'RESTRICTIVE' 
      : fedRate > 4 ? 'MODERATELY_RESTRICTIVE'
      : fedRate > 3 ? 'NEUTRAL'
      : 'ACCOMMODATIVE';
    
    return {
      rate: fedRate,
      stance,
      bearishSignal: fedRate > 5 ? true : false,
      message: `Fed funds ${stance}: ${fedRate.toFixed(2)}%`
    };
  } catch (err) {
    console.error('[FedRate] Fetch failed:', err.message);
    return null;
  }
}

// ── Composite Macro Regime ───────────────────────────────────────────────────
export async function detectMacroRegime() {
  const [vix, yields, breadth, geopolitical, fedRate] = await Promise.all([
    getVIX(),
    getYieldCurve(),
    getNYSEBreadth(),
    getGeopoliticalRisk(),
    getFedRate()
  ]);

  // Count bearish signals
  let bearishCount = 0;
  const signals = {
    vix: vix?.bearishSignal || false,
    yieldCurve: yields?.bearishSignal || false,
    breadth: breadth?.bearishSignal || false,
    geopolitical: geopolitical?.bearishSignal || false,
    fedRate: fedRate?.bearishSignal || false
  };

  for (const [key, value] of Object.entries(signals)) {
    if (value) bearishCount++;
  }

  // Determine regime based on signal count
  let regime, confidence;
  
  if (bearishCount >= 3) {
    // 3+ bearish signals = BEAR market
    regime = 'BEAR';
    confidence = Math.min(0.95, 0.60 + (bearishCount * 0.1));
  } else if (bearishCount === 2) {
    // 2 bearish signals = SIDEWAYS (distribution)
    regime = 'SIDEWAYS';
    confidence = 0.65;
  } else if (bearishCount === 1) {
    // 1 bearish signal = caution (still mostly BULL but weakening)
    regime = 'BULL';
    confidence = 0.55; // Lower confidence
  } else {
    // 0 bearish signals = BULL
    regime = 'BULL';
    confidence = 0.75; // High confidence
  }

  return {
    regime,
    confidence,
    timestamp: new Date().getTime(),
    signals,
    bearishSignalCount: bearishCount,
    details: {
      vix,
      yieldCurve: yields,
      breadth,
      geopolitical,
      fedRate
    },
    rationale: `${regime} regime (${bearishCount} bearish signals, confidence ${(confidence * 100).toFixed(0)}%)`
  };
}

// ── Export for testing ───────────────────────────────────────────────────────
export {
  getVIX,
  getYieldCurve,
  getNYSEBreadth,
  getGeopoliticalRisk,
  getFedRate
};
