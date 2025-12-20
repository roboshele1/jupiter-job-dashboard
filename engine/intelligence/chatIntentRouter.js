/**
 * Chat Intent Router
 * ------------------
 * Maps natural language → math engines.
 */

export function routeIntent(text = "") {
  const t = text.toLowerCase();

  if (t.includes("make") && t.includes("months")) return "GROWTH_TARGET";
  if (t.includes("trajectory")) return "TRAJECTORY_MATCH";
  if (t.includes("risk")) return "RISK_EXPLAIN";

  return "UNKNOWN";
}

