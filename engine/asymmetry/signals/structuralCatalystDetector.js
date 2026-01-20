/**
 * Structural Catalyst Detector — Institutional Grade
 *
 * Purpose:
 * Detects non-consensus structural catalysts that can unlock asymmetry.
 * This is NOT news scraping or sentiment.
 *
 * Catalysts include:
 * - Capital structure inflection
 * - Regulatory / venue upgrades
 * - Balance sheet regime shifts
 * - Business model transition signals
 *
 * Philosophy:
 * - Catalysts are optional but multiplicative
 * - Score is additive, never disqualifying
 * - Absence ≠ negative
 */

module.exports = function structuralCatalystDetector(asset = {}) {
  const notes = [];
  let score = 0;
  let detected = false;

  const market = asset.market || {};
  const structure = asset.structure || {};
  const balanceSheet = asset.balanceSheet || {};
  const meta = asset.meta || {};

  /**
   * 1. Venue / Listing Upgrade
   * Example: OTC → NASDAQ, uplisting prep
   */
  if (market.venue && ['XNAS', 'XNYS', 'ARCX'].includes(market.venue)) {
    score += 5;
    detected = true;
    notes.push('Primary exchange listing (structural legitimacy)');
  }

  /**
   * 2. Capital Structure Reset
   * No recent dilution + no reverse splits
   */
  if (
    structure.dilutionRisk === false &&
    Number(structure.recentOfferings || 0) === 0 &&
    Number(structure.reverseSplits || 0) === 0
  ) {
    score += 5;
    detected = true;
    notes.push('Clean capital structure (no recent dilution)');
  }

  /**
   * 3. Balance Sheet Inflection
   * Cash runway sufficient to execute catalyst
   */
  if (Number(balanceSheet.cashRunwayMonths || 0) >= 12) {
    score += 5;
    detected = true;
    notes.push('Sufficient cash runway to realize structural upside');
  }

  /**
   * 4. Regime Transition Signal
   * Normalized / refreshed asset state
   */
  if (meta.normalizedAt) {
    score += 3;
    detected = true;
    notes.push('Recent asset state normalization (data freshness)');
  }

  /**
   * 5. Deep Asymmetry Allowance
   * Structural catalysts can exist even on weaker venues
   */
  if (market.venue === 'OTC' && score > 0) {
    score = Math.max(score - 2, 3);
    notes.push('OTC venue — catalyst discounted but not ignored');
  }

  return {
    score,
    detected,
    notes
  };
};
