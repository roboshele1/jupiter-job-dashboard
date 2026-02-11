export function classifyDetection(detection = {}) {
  if (!detection || detection.status === "INSUFFICIENT_DATA") {
    return {
      status: "NO_CLASSIFICATION",
      reason: "Insufficient detection data"
    };
  }

  const {
    drawdown = 0,
    concentrationChange = 0,
    allocationDrift = {}
  } = detection;

  // -----------------------------
  // DRAWNDOWN CLASSIFICATION
  // -----------------------------
  let drawdownState = "NORMAL";

  if (drawdown <= -0.10) drawdownState = "RISK_EVENT";
  else if (drawdown <= -0.06) drawdownState = "RISK_BUILDING";
  else if (drawdown <= -0.03) drawdownState = "WATCH";
  else drawdownState = "NORMAL";

  // -----------------------------
  // CONCENTRATION CLASSIFICATION
  // -----------------------------
  let concentrationState = "STABLE";

  if (concentrationChange >= 0.30) concentrationState = "CRITICAL";
  else if (concentrationChange >= 0.25) concentrationState = "WARNING";
  else if (concentrationChange >= 0.20) concentrationState = "NOTICE";
  else concentrationState = "STABLE";

  // -----------------------------
  // DRIFT CLASSIFICATION
  // -----------------------------
  let driftFlags = [];

  Object.entries(allocationDrift).forEach(([symbol, drift]) => {
    if (Math.abs(drift) >= 0.025) {
      driftFlags.push({ symbol, state: "REBALANCE_ZONE", drift });
    } else if (Math.abs(drift) >= 0.01) {
      driftFlags.push({ symbol, state: "DRIFT", drift });
    }
  });

  // -----------------------------
  // FINAL CLASSIFICATION OBJECT
  // -----------------------------
  return {
    timestamp: Date.now(),

    portfolioStates: {
      drawdown: drawdownState,
      concentration: concentrationState
    },

    driftSignals: driftFlags
  };
}
