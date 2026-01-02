// renderer/insights/confidenceNormalizer.js
// Phase 2D — Confidence Normalization (deterministic, read-only)

const EPS = 1e-9;

// Min-max normalize to [0,1], then clamp
export function normalize01(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (typeof min !== 'number' || typeof max !== 'number' || min === max) return null;
  const z = (value - min) / (max - min + EPS);
  return Math.min(1, Math.max(0, z));
}

// Z-score normalize, then map to [0,1] via logistic and clamp
export function normalizeZ(value, mean, std) {
  if (![value, mean, std].every(v => typeof v === 'number' && Number.isFinite(v)) || std <= 0) return null;
  const z = (value - mean) / std;
  const s = 1 / (1 + Math.exp(-z));
  return Math.min(1, Math.max(0, s));
}

// Clamp any score to [lo, hi]
export function clamp(value, lo = 0, hi = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(hi, Math.max(lo, value));
}

