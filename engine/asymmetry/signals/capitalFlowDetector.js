/**
 * Capital Flow Detector — Institutional Grade
 * Detects stealth accumulation using volume, VWAP pressure, and price efficiency
 *
 * Philosophy:
 * - Institutions accumulate with volume BEFORE price expansion
 * - We reward volume expansion + muted price response
 * - Penalize late-stage momentum
 */

module.exports = function capitalFlowDetector(asset = {}) {
  const market = asset.market || {};
  const volume = market.volume || {};
  const price = market.price || {};

  const avg30d = Number(volume.avg30d || 0);
  const recent5d = Number(volume.recent5d || 0);
  const priceChange30d = Number(price.change30d || 0);

  const notes = [];
  let score = 0;
  let detected = false;

  // Hard data availability check
  if (!avg30d || !recent5d) {
    return {
      score: 0,
      detected: false,
      notes: ['Insufficient volume data']
    };
  }

  const volumeExpansionRatio = recent5d / avg30d;

  /**
   * CORE LOGIC
   * 1. Volume expansion must be meaningful
   * 2. Price must NOT have expanded aggressively
   * 3. Sweet spot = quiet accumulation
   */

  // Strong stealth accumulation
  if (volumeExpansionRatio >= 1.4 && priceChange30d < 0.08) {
    score = 20;
    detected = true;
    notes.push('Strong volume expansion without price expansion');
    notes.push('Institutional stealth accumulation detected');
  }

  // Moderate accumulation
  else if (volumeExpansionRatio >= 1.2 && priceChange30d < 0.12) {
    score = 15;
    detected = true;
    notes.push('Moderate volume accumulation');
  }

  // Early accumulation (watch zone)
  else if (volumeExpansionRatio >= 1.1 && priceChange30d < 0.15) {
    score = 10;
    detected = true;
    notes.push('Early accumulation phase');
  }

  // Late-stage momentum (explicitly penalized)
  else if (priceChange30d >= 0.2) {
    score = 0;
    detected = false;
    notes.push('Late-stage price expansion — not accumulation');
  }

  // No signal
  else {
    score = 0;
    detected = false;
    notes.push('No accumulation signal detected');
  }

  return {
    score,
    detected,
    notes,
    diagnostics: {
      volumeExpansionRatio: Number(volumeExpansionRatio.toFixed(2)),
      priceChange30d: Number((priceChange30d * 100).toFixed(2)) + '%'
    }
  };
};
