/**
 * Conviction Escalation Ladder
 *
 * Purpose:
 * - Translate asymmetry + survivability + pressure into actionable conviction
 * - This is NOT execution, NOT sizing, NOT timing
 *
 * Conviction Levels:
 * - WATCH        → Track only
 * - BUILD        → Early asymmetric build candidate
 * - PRESS        → High-conviction asymmetric opportunity
 * - SCALE        → Rare, elite asymmetry (top 1–3)
 */

module.exports = function convictionEscalationLadder({
  symbol,
  regime = 'PRIMARY',
  asymmetryScore = 0,
  pressureScore = 0,
  pressureBand = 'UNKNOWN',
  survivabilityPassed = false
}) {
  const notes = [];
  let conviction = 'WATCH';
  let rationale = [];

  // Hard safety check
  if (!survivabilityPassed) {
    return {
      conviction: 'DISQUALIFIED',
      rationale: ['Failed survivability gate'],
      notes: []
    };
  }

  // Base asymmetry logic
  if (asymmetryScore >= 85) {
    conviction = 'SCALE';
    rationale.push('Elite asymmetry score (≥85)');
  } else if (asymmetryScore >= 75) {
    conviction = 'PRESS';
    rationale.push('High asymmetry score (75–84)');
  } else if (asymmetryScore >= 60) {
    conviction = 'BUILD';
    rationale.push('Latent asymmetry (60–74)');
  } else {
    conviction = 'WATCH';
    rationale.push('Below asymmetry activation threshold');
  }

  // Pressure modulation (important for Deep Asymmetry)
  if (regime === 'DEEP_ASYMMETRY') {
    notes.push('Deep Asymmetry regime active');

    if (pressureBand === 'LOW') {
      notes.push('Low pressure tolerance — early positioning only');
    }

    if (pressureBand === 'HIGH' && conviction === 'SCALE') {
      conviction = 'PRESS';
      rationale.push('Pressure sensitivity downgraded SCALE → PRESS');
    }
  }

  // Guardrail: never SCALE with high pressure risk
  if (pressureBand === 'HIGH' && conviction === 'SCALE') {
    conviction = 'PRESS';
    rationale.push('High pressure risk — SCALE downgraded');
  }

  // Final sanity
  notes.push(`Pressure score: ${pressureScore}`);
  notes.push(`Pressure band: ${pressureBand}`);

  return {
    symbol,
    conviction,
    rationale,
    notes
  };
};
