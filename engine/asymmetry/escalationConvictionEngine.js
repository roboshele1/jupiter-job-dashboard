/**
 * Escalation Conviction Engine
 * Final orchestration layer for asymmetry evaluation
 *
 * Responsibilities:
 * - Run Autonomous Moonshot Scanner
 * - Apply Conviction Escalation Ladder
 * - Preserve full rejection + reasoning transparency
 *
 * NO execution
 * NO sizing
 * NO timing
 */

const autonomousMoonshotScanner = require('./autonomousMoonshotScanner');
const convictionEscalationLadder = require('./convictionEscalationLadder');

module.exports = function escalationConvictionEngine(universe = []) {
  const scanResult = autonomousMoonshotScanner(universe);

  const escalated = [];
  const rejected = scanResult.rejected || [];

  for (const asset of universe) {
    const symbol = asset.symbol;

    // Find scan output (surfaced or rejected)
    const surfacedHit = (scanResult.surfaced || []).find(s => s.symbol === symbol);
    const rejectedHit = rejected.find(r => r.symbol === symbol);

    // If rejected at scan stage, carry forward
    if (rejectedHit) {
      escalated.push({
        symbol,
        status: 'REJECTED',
        conviction: 'DISQUALIFIED',
        reasons: rejectedHit.disqualificationReasons,
        asymmetryScore: rejectedHit.asymmetryScore,
        signalBreakdown: rejectedHit.signalBreakdown
      });
      continue;
    }

    if (!surfacedHit) {
      continue;
    }

    // Pull survivability + pressure context from asset
    const survivabilityPassed = true; // already gated upstream
    const regime = asset.regime || 'PRIMARY';

    const pressure = asset.positionPressure || {
      pressureScore: 0,
      pressureBand: 'UNKNOWN'
    };

    // Escalate conviction
    const conviction = convictionEscalationLadder({
      symbol,
      regime,
      asymmetryScore: surfacedHit.asymmetryScore,
      pressureScore: pressure.pressureScore,
      pressureBand: pressure.pressureBand,
      survivabilityPassed
    });

    escalated.push({
      symbol,
      status: 'EVALUATED',
      regime,
      asymmetryScore: surfacedHit.asymmetryScore,
      conviction: conviction.conviction,
      rationale: conviction.rationale,
      notes: conviction.notes,
      signalBreakdown: surfacedHit.signalBreakdown,
      lastEvaluated: new Date().toISOString()
    });
  }

  return {
    engine: 'EscalationConvictionEngine',
    evaluated: universe.length,
    timestamp: new Date().toISOString(),
    results: escalated
  };
};
