/**
 * Query Interpreter
 * -----------------
 * Routes user questions to engines.
 */

import { requiredMonthlyInvestment } from "./goalSolver";

export function interpretQuery(query) {
  if (query.includes("make") && query.includes("months")) {
    return { type: "GOAL_SOLVER" };
  }

  return { type: "UNKNOWN" };
}

