/**
 * CLASSIFIER ENGINE — DRIFT + PORTFOLIO STATES
 * Deterministic conversion:
 * detection → classification signals
 */

const DRIFT_ALERT_THRESHOLD = 0.002; // 0.2% allocation move

function classifyDrawdown(drawdown) {
  if (drawdown < -0.1) return "CRITICAL";
  if (drawdown < -0.05) return "ELEVATED";
  return "NORMAL";
}

function classifyConcentration(change) {
  if (Math.abs(change) > 0.1) return "HIGH";
  if (Math.abs(change) > 0.05) return "ELEVATED";
  return "STABLE";
}

function classifyDrift(allocationDrift = {}) {
  const signals = [];

  Object.entries(allocationDrift).forEach(([symbol, drift]) => {
    if (Math.abs(drift) >= DRIFT_ALERT_THRESHOLD) {
      signals.push({
        type: "ALLOCATION_DRIFT",
        symbol,
        magnitude: drift,
        direction: drift > 0 ? "INCREASE" : "DECREASE",
        severity:
          Math.abs(drift) > 0.02
            ? "HIGH"
            : Math.abs(drift) > 0.01
            ? "MEDIUM"
            : "LOW"
      });
    }
  });

  return signals;
}

export function classifyDetection(detection = {}) {
  const drawdownState = classifyDrawdown(detection.drawdown || 0);
  const concentrationState = classifyConcentration(
    detection.concentrationChange || 0
  );

  const driftSignals = classifyDrift(detection.allocationDrift);

  return {
    timestamp: Date.now(),

    portfolioStates: {
      drawdown: drawdownState,
      concentration: concentrationState
    },

    driftSignals
  };
}
