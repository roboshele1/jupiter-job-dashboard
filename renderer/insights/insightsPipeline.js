// renderer/insights/insightsPipeline.js
// Phase 2D — Confidence Normalization (REAL MODE)
// Builds on Phase 2C; no UI impact

import { generateInsights } from './insightsEngine.js';
import { getPreviousSnapshot, setPreviousSnapshot } from './insightsHistory.js';
import { normalize01, normalizeZ, clamp } from './confidenceNormalizer.js';

const STALE_MS = 15 * 60 * 1000; // 15 minutes

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function validateSnapshot(insights) {
  const warnings = [];
  let valid = true;

  const ts = insights?.snapshot?.timestamp;
  if (!isFiniteNumber(ts) || Date.now() - ts > STALE_MS) {
    warnings.push('stale_snapshot');
    valid = false;
  }

  const totalValue = insights?.portfolio?.totalValue;
  if (!isFiniteNumber(totalValue) || totalValue <= 0) {
    warnings.push('invalid_portfolio_value');
    valid = false;
  }

  return { valid, warnings };
}

function computeDeltas(curr, prev) {
  if (!prev) return {};

  const deltas = {};
  const currValue = curr?.portfolio?.totalValue;
  const prevValue = prev?.portfolio?.totalValue;

  if (isFiniteNumber(currValue) && isFiniteNumber(prevValue)) {
    deltas.deltaPortfolioImpact = currValue - prevValue;
    deltas.deltaPortfolioImpactPct =
      prevValue !== 0 ? (currValue - prevValue) / prevValue : null;
  }

  const currTs = curr?.snapshot?.timestamp;
  const prevTs = prev?.snapshot?.timestamp;
  if (isFiniteNumber(currTs) && isFiniteNumber(prevTs)) {
    deltas.deltaMomentumMs = currTs - prevTs;
  }

  return deltas;
}

// Normalize confidences from heterogeneous inputs into [0,1]
function normalizeConfidences(insights) {
  // Inputs we may have today or later
  const momentumMs = insights?.deltas?.deltaMomentumMs;
  const impactPct = insights?.deltas?.deltaPortfolioImpactPct;

  // Conservative ranges for cross-asset comparability
  const MOMENTUM_MIN = -60 * 60 * 1000; // -1h
  const MOMENTUM_MAX =  60 * 60 * 1000; // +1h

  // Portfolio impact percent: clamp extreme tails
  const IMPACT_MIN = -0.05; // -5%
  const IMPACT_MAX =  0.05; // +5%

  const momentumScore = normalize01(momentumMs, MOMENTUM_MIN, MOMENTUM_MAX);
  const impactScore = normalize01(impactPct, IMPACT_MIN, IMPACT_MAX);

  // Aggregate with equal weights; ignore nulls deterministically
  const parts = [momentumScore, impactScore].filter(v => v !== null);
  const composite =
    parts.length ? clamp(parts.reduce((a, b) => a + b, 0) / parts.length) : null;

  return {
    momentumScore,
    impactScore,
    confidence: composite
  };
}

export async function buildInsightsSnapshot(valuationSnapshot) {
  const engineOut = generateInsights({
    snapshot: {
      available: true,
      timestamp: valuationSnapshot?.timestamp ?? null
    },
    portfolio: {
      available: true,
      totalValue: valuationSnapshot?.summary?.totalValue ?? null,
      allocation: valuationSnapshot?.allocation ?? null,
      topHoldings: valuationSnapshot?.topHoldings ?? []
    }
  });

  const { valid, warnings } = validateSnapshot(engineOut);
  const prev = getPreviousSnapshot();
  const deltas = computeDeltas(engineOut, prev);
  const confidence = normalizeConfidences({ ...engineOut, deltas });

  const out = {
    ...engineOut,
    deltas,
    confidence, // <-- Phase 2D output (read-only)
    signals: valid ? engineOut.signals ?? [] : [],
    limitations: valid
      ? engineOut.limitations ?? []
      : [...(engineOut.limitations ?? []), 'signals_withheld_by_validation'],
    warnings: [...(engineOut.warnings ?? []), ...warnings]
  };

  setPreviousSnapshot(engineOut);
  return out;
}

