// engine/insightsEngine.js
// Insights Engine — read-only, deterministic, IPC-safe
// Purpose: surface portfolio-level insights & observations without mutation

function nowIso() {
  return new Date().toISOString();
}

function getInsightsSnapshot() {
  return {
    status: "ok",
    ts: nowIso(),
    insights: [
      {
        id: "DIVERSIFICATION",
        title: "Diversification Check",
        message: "Portfolio spans equities and crypto with meaningful allocation to both.",
        severity: "info",
      },
      {
        id: "CONCENTRATION",
        title: "Concentration Watch",
        message: "Top holdings account for a significant portion of total value.",
        severity: "warning",
      },
      {
        id: "TIME_HORIZON",
        title: "Time Horizon Alignment",
        message: "Holdings align with a long-term compounding strategy.",
        severity: "positive",
      },
    ],
    meta: {
      source: "insightsEngine",
      readOnly: true,
    },
  };
}

module.exports = {
  getInsightsSnapshot,
};

