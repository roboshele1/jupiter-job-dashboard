/**
 * cagrAssumptions.js — renderer-safe
 * Full replacement; does not use require or Node APIs.
 * Always works in browser/renderer context.
 */

const DEFAULT_CAGR = {
  // Semiconductors
  NVDA: 0.28,
  AVGO: 0.25,
  ASML: 0.18,
  TSM: 0.18,

  // Software
  NOW: 0.20,

  // BTC proxy / Bitcoin miners
  MSTR: 0.35,
  BMNR: 0.12,
  APLD: 0.10,

  // Fintech
  HOOD: 0.15,

  // Crypto — direct
  BTC: 0.40,
  ETH: 0.25,
};

const FALLBACK_CAGR = 0.12; // 12% fallback for unknown symbols

// No Node fs/require — renderer-safe only
let _userOverrides = {};
let _mergedCAGR = null;

function getMergedCAGR() {
  if (_mergedCAGR) return _mergedCAGR;
  // Always defaults in renderer
  _mergedCAGR = Object.freeze({ ...DEFAULT_CAGR, ..._userOverrides });
  return _mergedCAGR;
}

/**
 * Reset cache after user changes overrides (not used in renderer by default)
 */
export function resetCAGRCache() {
  _mergedCAGR = null;
}

/**
 * Proxy object to read merged CAGR assumptions
 */
export const CAGR = new Proxy({}, {
  get(_, symbol) {
    if (typeof symbol !== 'string') return undefined;
    return getMergedCAGR()[symbol.toUpperCase()];
  },
  has(_, symbol) {
    return symbol in getMergedCAGR();
  },
  ownKeys() {
    return Object.keys(getMergedCAGR());
  },
  getOwnPropertyDescriptor(_, symbol) {
    const val = getMergedCAGR()[symbol];
    if (val === undefined) return undefined;
    return { value: val, writable: false, enumerable: true, configurable: false };
  },
});

/**
 * Get CAGR for a single symbol; fallback if unknown
 */
export function getCAGR(symbol) {
  if (!symbol) return FALLBACK_CAGR;
  return getMergedCAGR()[String(symbol).toUpperCase()] ?? FALLBACK_CAGR;
}

/**
 * Compute portfolio blended CAGR by value weighting
 */
export function blendedCAGR(positions) {
  if (!Array.isArray(positions) || positions.length === 0) return FALLBACK_CAGR;
  const total = positions.reduce((s, p) => s + (Number(p.liveValue) || 0), 0);
  if (!total) return FALLBACK_CAGR;
  return positions.reduce((s, p) => {
    const w = (Number(p.liveValue) || 0) / total;
    return s + w * getCAGR(p.symbol);
  }, 0);
}

/**
 * Return full merged map
 */
export function getAllCAGR() {
  return { ...getMergedCAGR() };
}

/**
 * Return user overrides (empty in renderer-safe mode)
 */
export function getUserOverrides() {
  return { ..._userOverrides };
}

/**
 * Defaults export
 */
export const DEFAULT_CAGR_ASSUMPTIONS = Object.freeze({ ...DEFAULT_CAGR });
export const DEFAULT_FALLBACK = FALLBACK_CAGR;
