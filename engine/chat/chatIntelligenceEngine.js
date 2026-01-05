/**
 * CHAT_INTELLIGENCE_ENGINE_V1
 * --------------------------
 * Phase 6.8 — Engine-only multi-engine synthesis
 * Phase 6.9 — Persistent intelligence memory (read-only)
 * Phase 7.1 — Contextual answer expansion
 * Phase 7.2 — Contextual market hydration
 * Phase 7.3 — Counterfactual & stress-path reasoning
 *
 * Deterministic. Stateless reasoning.
 * Memory is append-only and diagnostic-only.
 */

import { routeChatQuery } from "./queryRouter.js";
import { getGlobalMarketIntelligence } from "../market/marketIntelligence.js";
import { getAuthoritativePortfolio } from "../portfolio/portfolioAuthority.js";
import { runDecisionEngine } from "../decision/decisionEngine.js";

/* =========================================================
   PHASE 6.9 — IN-MEMORY INTELLIGENCE LOG
========================================================= */

const INTELLIGENCE_MEMORY = [];
const MAX_MEMORY = 50;

function recordIntelligenceSnapshot(snapshot) {
  INTELLIGENCE_MEMORY.push(snapshot);
  if (INTELLIGENCE_MEMORY.length > MAX_MEMORY) {
    INTELLIGENCE_MEMORY.shift();
  }
}

function analyzeMemoryDrift() {
  if (INTELLIGENCE_MEMORY.length < 3) {
    return { samples: INTELLIGENCE_MEMORY.length, unstable: false, observedStates: [] };
  }

  const recent = INTELLIGENCE_MEMORY.slice(-5);
  const states = recent.map(r => r.synthesisState);
  const uniqueStates = [...new Set(states)];

  return {
    samples: recent.length,
    unstable: uniqueStates.length > 1,
    observedStates: uniqueStates,
  };
}

/* =========================================================
   PORTFOLIO RISK LENS
========================================================= */

function detectPortfolioLens(query) {
  const q = query.toLowerCase();

  if (q.includes("rate") || q.includes("interest")) return "RATE_SENSITIVITY";
  if (q.includes("risk-off") || q.includes("drawdown") || q.includes("crash")) return "RISK_OFF_EXPOSURE";
  if (q.includes("leverage") || q.includes("margin")) return "LEVERAGE_SENSITIVITY";
  if (q.includes("concentrated") || q.includes("concentration")) return "CONCENTRATION";

  return "GENERAL_EXPOSURE";
}

/* =========================================================
   PHASE 7.3 — COUNTERFACTUAL / STRESS PATH ENGINE
========================================================= */

function buildCounterfactualInsights({ lens, market, decision }) {
  const scenarios = [];

  if (lens === "RATE_SENSITIVITY") {
    scenarios.push(
      "If rates rise further, valuation pressure would disproportionately affect higher-duration growth and crypto-linked assets."
    );
  }

  if (lens === "RISK_OFF_EXPOSURE") {
    scenarios.push(
      "In a rapid risk-off transition, drawdowns would likely be concentrated rather than broad-based."
    );
  }

  if (lens === "LEVERAGE_SENSITIVITY" && decision) {
    scenarios.push(
      "Introducing leverage under the current posture would amplify both upside participation and downside volatility."
    );
  }

  if (lens === "CONCENTRATION") {
    scenarios.push(
      "Stress events would be felt most through top-weighted positions rather than smaller allocations."
    );
  }

  return scenarios;
}

/* =========================================================
   CONTEXTUAL ANSWER EXPANSION
========================================================= */

function buildContextualInsights({ intent, lens, market, portfolio, decision }) {
  const insights = [];

  if (intent === "PORTFOLIO" && portfolio) {
    if (lens === "RATE_SENSITIVITY" && market) {
      insights.push(
        "Rate-sensitive growth and crypto exposures would be most affected if restrictive conditions persist."
      );
    }

    if (lens === "RISK_OFF_EXPOSURE" && market) {
      insights.push(
        "Downside risk would concentrate in higher-beta positions rather than evenly across the portfolio."
      );
    }

    if (lens === "CONCENTRATION") {
      insights.push(
        "Portfolio risk is driven more by position size than by the number of holdings."
      );
    }

    if (lens === "LEVERAGE_SENSITIVITY" && decision) {
      insights.push(
        "Leverage would amplify volatility under the current growth-allowed posture."
      );
    }
  }

  return insights;
}

/* =========================================================
   MAIN ENGINE
========================================================= */

export async function runChatIntelligence(query = "") {
  const routing = routeChatQuery(query);
  const lens = detectPortfolioLens(query);

  let market = null;
  let portfolio = null;
  let decision = null;
  let marketHydrated = false;

  for (const engine of routing.engines) {
    if (engine === "marketIntelligence") {
      market = getGlobalMarketIntelligence();
    }

    if (engine === "portfolioAuthority") {
      portfolio = await getAuthoritativePortfolio();
    }

    if (engine === "decisionEngine") {
      decision = await runDecisionEngine({ query });
    }
  }

  if (
    routing.intent === "PORTFOLIO" &&
    !market &&
    (lens === "RATE_SENSITIVITY" || lens === "RISK_OFF_EXPOSURE")
  ) {
    market = getGlobalMarketIntelligence();
    marketHydrated = true;
  }

  const summary = [];

  summary.push(
    ...buildContextualInsights({ intent: routing.intent, lens, market, portfolio, decision })
  );

  summary.push(
    ...buildCounterfactualInsights({ lens, market, decision })
  );

  if (market) {
    summary.push(
      `Market regime is ${market.regime.state} with ${(market.regime.confidence * 100).toFixed(0)}% confidence.`
    );
  }

  if (portfolio) {
    summary.push(
      `Your portfolio holds ${portfolio.holdings.length} positions with ${portfolio.currency} exposure.`
    );
  }

  if (decision) {
    summary.push(
      `Decision posture is ${decision.assessment.posture} under a ${decision.assessment.regime} regime.`
    );
  }

  let synthesisState = "NEUTRAL";
  if (market && decision) {
    synthesisState =
      market.regime.state === decision.assessment.regime ? "ALIGNED" : "DIVERGENT";
  }

  recordIntelligenceSnapshot({
    timestamp: Date.now(),
    intent: routing.intent,
    confidence: routing.confidence,
    synthesisState,
    sources: routing.engines,
  });

  return {
    contract: "CHAT_INTELLIGENCE_V1",
    intent: routing.intent,
    confidence: routing.confidence,
    synthesisState,
    sources: routing.engines,
    summary: summary.slice(0, 5),
    diagnostics: {
      marketLoaded: !!market,
      marketHydrated,
      portfolioLoaded: !!portfolio,
      decisionLoaded: !!decision,
      memory: analyzeMemoryDrift(),
    },
    timestamp: Date.now(),
  };
}
