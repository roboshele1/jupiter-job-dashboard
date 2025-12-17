// ~/JUPITER/electron/engine/priorityEngine.js

/*
Phase 3A · Step 3 — Priority Ranking Engine

Purpose:
- Rank actionable priorities across Growth, Risk, Signals
- Deterministic scoring (no LLM)
- Single ordered list for Dashboard, Alerts, Chat
*/

export function rankPriorities({
  insights = [],
  growth = [],
  risk = {}
}) {
  const priorities = [];

  // ---- FROM INSIGHTS ----
  insights.forEach(i => {
    priorities.push({
      source: "Insight",
      score: i.severity * 10,
      message: i.message
    });
  });

  // ---- FROM GROWTH ----
  growth.forEach(g => {
    if (g.totalReturnPct >= 40) {
      priorities.push({
        source: "Growth",
        score: Math.round(g.totalReturnPct),
        message: `${g.symbol} offers projected upside of ${g.totalReturnPct.toFixed(
          1
        )}% over ${g.years} years.`
      });
    }
  });

  // ---- FROM RISK ----
  if (risk.concentrationFlag) {
    priorities.push({
      source: "Risk",
      score: 50,
      message:
        "Portfolio concentration risk is elevated and should be addressed."
    });
  }

  // ---- FALLBACK ----
  if (!priorities.length) {
    priorities.push({
      source: "System",
      score: 0,
      message: "No actionable priorities detected."
    });
  }

  // ---- SORT (DESC SCORE) ----
  return priorities.sort((a, b) => b.score - a.score);
}

