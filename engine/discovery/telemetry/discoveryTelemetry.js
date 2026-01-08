/**
 * DISCOVERY TELEMETRY — D13.4
 * --------------------------
 * Read-only observability for discovery silence.
 * No decisions. No filtering. No mutation.
 */

function initDiscoveryTelemetry() {
  return {
    universeRawCount: 0,
    universeNormalizedCount: 0,
    evaluatedCount: 0,
    canonicalCount: 0,
    notes: [],
  };
}

function record(note, telemetry) {
  telemetry.notes.push(note);
}

function finalize({ universeRaw, universeNormalized, evaluated, canonical }, telemetry) {
  telemetry.universeRawCount = universeRaw;
  telemetry.universeNormalizedCount = universeNormalized;
  telemetry.evaluatedCount = evaluated;
  telemetry.canonicalCount = canonical;

  if (canonical === 0) {
    record(
      "No assets met discovery conviction thresholds under current regime and constraints.",
      telemetry
    );
  }

  return Object.freeze(telemetry);
}

module.exports = Object.freeze({
  initDiscoveryTelemetry,
  finalize,
  record,
});
