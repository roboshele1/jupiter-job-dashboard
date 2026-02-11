export function generateAlerts(classification = {}) {
  if (!classification || classification.status === "NO_CLASSIFICATION") {
    return [];
  }

  const alerts = [];

  const { portfolioStates = {}, driftSignals = [] } = classification;

  // -----------------------------
  // DRAWNDOWN ALERTS
  // -----------------------------
  if (portfolioStates.drawdown === "WATCH") {
    alerts.push({
      type: "DRAWDOWN_WATCH",
      severity: "MEDIUM",
      source: "drawdown",
      message: "Portfolio drawdown entering watch zone.",
      timestamp: Date.now()
    });
  }

  if (portfolioStates.drawdown === "RISK_BUILDING") {
    alerts.push({
      type: "DRAWDOWN_RISK_BUILDING",
      severity: "HIGH",
      source: "drawdown",
      message: "Portfolio drawdown accelerating.",
      timestamp: Date.now()
    });
  }

  if (portfolioStates.drawdown === "RISK_EVENT") {
    alerts.push({
      type: "DRAWDOWN_RISK_EVENT",
      severity: "CRITICAL",
      source: "drawdown",
      message: "Portfolio drawdown critical.",
      timestamp: Date.now()
    });
  }

  // -----------------------------
  // CONCENTRATION ALERTS
  // -----------------------------
  if (portfolioStates.concentration === "NOTICE") {
    alerts.push({
      type: "CONCENTRATION_NOTICE",
      severity: "LOW",
      source: "concentration",
      message: "Position concentration increasing.",
      timestamp: Date.now()
    });
  }

  if (portfolioStates.concentration === "WARNING") {
    alerts.push({
      type: "CONCENTRATION_WARNING",
      severity: "MEDIUM",
      source: "concentration",
      message: "Portfolio concentration elevated.",
      timestamp: Date.now()
    });
  }

  if (portfolioStates.concentration === "CRITICAL") {
    alerts.push({
      type: "CONCENTRATION_CRITICAL",
      severity: "HIGH",
      source: "concentration",
      message: "Portfolio concentration critical.",
      timestamp: Date.now()
    });
  }

  // -----------------------------
  // DRIFT ALERTS
  // -----------------------------
  driftSignals.forEach(signal => {
    if (signal.state === "DRIFT") {
      alerts.push({
        type: "ALLOCATION_DRIFT",
        severity: "LOW",
        source: signal.symbol,
        message: `Allocation drift detected for ${signal.symbol}.`,
        drift: signal.drift,
        timestamp: Date.now()
      });
    }

    if (signal.state === "REBALANCE_ZONE") {
      alerts.push({
        type: "REBALANCE_CANDIDATE",
        severity: "MEDIUM",
        source: signal.symbol,
        message: `Rebalance candidate identified for ${signal.symbol}.`,
        drift: signal.drift,
        timestamp: Date.now()
      });
    }
  });

  return alerts;
}
