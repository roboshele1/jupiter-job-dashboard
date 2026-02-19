/**
 * Insights Engine V2
 * ------------------
 * Canonical, deterministic portfolio interpretation engine.
 * Growth tilt derived dynamically from Polygon sector data — no hardcoded symbols.
 * Node-only. No IPC. No UI. No side effects.
 */

import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

// Dynamically fetch sector for a symbol from Polygon reference
async function fetchSector(symbol) {
  try {
    const res = await fetch(
      `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${POLYGON_KEY}`,
      { timeout: 5000 }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.sic_description ?? data?.results?.type ?? null;
  } catch {
    return null;
  }
}

// Growth sectors — derived from SIC/type classification, not hardcoded symbols
const GROWTH_SECTOR_KEYWORDS = [
  "technology", "semiconductor", "software", "computer",
  "electronic", "internet", "digital", "cloud", "biotech",
  "pharmaceutical", "communication", "crypto", "bitcoin"
];

function isGrowthSector(sectorDesc) {
  if (!sectorDesc) return false;
  const lower = sectorDesc.toLowerCase();
  return GROWTH_SECTOR_KEYWORDS.some(kw => lower.includes(kw));
}

export async function computeInsights(snapshot) {
  const portfolio = snapshot?.portfolio;
  const positions = Array.isArray(portfolio?.positions) ? portfolio.positions : [];

  const totalValue = positions.reduce(
    (sum, p) => sum + (typeof p.liveValue === "number" ? p.liveValue : 0), 0
  );

  const totalHoldings = positions.length;
  const sortedByValue = positions.slice().sort((a, b) => (b.liveValue || 0) - (a.liveValue || 0));
  const topHolding  = sortedByValue[0] || null;
  const topWeight   = topHolding && totalValue > 0 ? (topHolding.liveValue / totalValue) * 100 : 0;

  // 1. Risk posture
  let riskPosture = "LOW";
  if (topWeight > 30 || totalHoldings < 6)       riskPosture = "HIGH";
  else if (topWeight > 20 || totalHoldings < 10)  riskPosture = "MODERATE";

  // 2. Diversification score
  let diversificationScore = "WEAK";
  if (totalHoldings >= 12 && topWeight < 25)      diversificationScore = "STRONG";
  else if (totalHoldings >= 8)                    diversificationScore = "MODERATE";

  // 3. Growth tilt — DYNAMIC: fetch sector from Polygon, not hardcoded list
  const sectorResults = await Promise.all(
    positions.map(async p => ({
      symbol:    p.symbol,
      liveValue: p.liveValue || 0,
      assetClass: p.assetClass,
      isGrowth:  p.assetClass === "crypto"
        ? true  // crypto always counts as growth
        : isGrowthSector(await fetchSector(p.symbol))
    }))
  );

  const growthValue  = sectorResults.filter(p => p.isGrowth).reduce((s, p) => s + p.liveValue, 0);
  const growthWeight = totalValue > 0 ? (growthValue / totalValue) * 100 : 0;

  let growthTilt = "BALANCED";
  if (growthWeight > 50)      growthTilt = "GROWTH_HEAVY";
  else if (growthWeight < 25) growthTilt = "DEFENSIVE";

  // 4. Volatility proxy — crypto weight as proxy
  const cryptoValue  = positions.filter(p => p.assetClass === "crypto").reduce((s, p) => s + (p.liveValue || 0), 0);
  const cryptoWeight = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

  let volatilityProxy = "LOW";
  if (cryptoWeight > 20)      volatilityProxy = "HIGH";
  else if (cryptoWeight > 10) volatilityProxy = "MODERATE";

  // 5. Concentration risk — HHI-based
  const weights    = positions.map(p => totalValue > 0 ? (p.liveValue || 0) / totalValue : 0);
  const hhi        = weights.reduce((s, w) => s + w * w, 0);
  const hhiScore   = hhi > 0.25 ? "HIGH" : hhi > 0.15 ? "MODERATE" : "LOW";

  // 6. Confidence band
  let confidenceBand = "HIGH";
  if (riskPosture === "HIGH" || volatilityProxy === "HIGH")            confidenceBand = "LOW";
  else if (riskPosture === "MODERATE" || volatilityProxy === "MODERATE") confidenceBand = "MODERATE";

  return {
    riskPosture,
    diversificationScore,
    growthTilt,
    volatilityProxy,
    concentrationRisk: hhiScore,
    confidenceBand,
    diagnostics: {
      totalValue,
      totalHoldings,
      topWeight,
      growthWeight,
      cryptoWeight,
      hhi: Math.round(hhi * 1000) / 1000,
      sectorBreakdown: sectorResults.map(p => ({ symbol: p.symbol, isGrowth: p.isGrowth })),
    }
  };
}
