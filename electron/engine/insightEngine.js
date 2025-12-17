// ~/JUPITER/electron/engine/insightEngine.js

/*
Phase 3A — Intelligence Depth
Insight Engine (Backend)

Purpose:
- Synthesize Signals + Growth + Risk into ranked insights
- Deterministic scoring (no LLM)
- Safe under missing data
*/

export function generateInsights({
  signals = [],
  growth = [],
  risk = {}
}) {
  const insights = [];

  // ---- SIGNALS ----
  signals.forEach(s => {
    if (s.type === "Momentum") {
      insights.push({
        category: "Signal",
        severity: 2,
        message: `${s.symbol} is exhibiting positive momentum. Consider monitoring for continuation.`
      });
    }
    if (s.type === "Weakness") {
      insights.push({
        category: "Signal",
        severity: 3,
        message: `${s.symbol} is under selling pressure. Downside risk elevated.`
      });
    }
  });

  // ---- GROWTH ----
  growth.forEach(g => {
    if (g.totalReturnPct >= 50) {
      insights.push({
        category: "Growth",
        severity: 1,
        message: `${g.symbol} shows strong projected upside (${g.totalReturnPct.toFixed(
          1
        )}% over ${g.years}y).`
      });
    }
  });

  // ---- RISK ----
  if (risk.concentrationFlag) {
    insights.push({
      category: "Risk",
      severity: 4,
      message:
        "Portfolio concentration risk detected. A single position exceeds acceptable allocation thresholds."
    });
  }

  // ---- FALLBACK ----
  if (insights.length === 0) {
    insights.push({
      category: "System",
      severity: 0,
      message:
        "No dominant opportunities or risks detected. Maintain current posture."
    });
  }

  // ---- SORT BY SEVERITY (DESC) ----
  return insights.sort((a, b) => b.severity - a.severity);
}

