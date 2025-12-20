// engine/learning/drift/driftEngine.js

const DEFAULTS = {
  confidenceDelta: 0.15,
  biasDelta: 0.15,
  signalHalfLifeDays: 30
};

let state = {
  lastConfidence: null,
  lastBias: null,
  lastSignalTs: null
};

export function evaluateDrift({
  confidence,
  bias,
  signalTs,
  now = Date.now(),
  cfg = DEFAULTS
}) {
  const alerts = [];

  if (state.lastConfidence !== null) {
    const dc = confidence - state.lastConfidence;
    if (Math.abs(dc) >= cfg.confidenceDelta) {
      alerts.push({ type: 'CONFIDENCE_DRIFT', delta: dc });
    }
  }

  if (state.lastBias !== null) {
    const db = bias - state.lastBias;
    if (Math.abs(db) >= cfg.biasDelta) {
      alerts.push({ type: 'BIAS_DRIFT', delta: db });
    }
  }

  if (state.lastSignalTs !== null) {
    const ageDays = (now - state.lastSignalTs) / (1000 * 60 * 60 * 24);
    if (ageDays >= cfg.signalHalfLifeDays) {
      alerts.push({ type: 'SIGNAL_DECAY', ageDays });
    }
  }

  state.lastConfidence = confidence;
  state.lastBias = bias;
  state.lastSignalTs = signalTs;

  return {
    ok: alerts.length === 0,
    alerts,
    ts: now
  };
}

