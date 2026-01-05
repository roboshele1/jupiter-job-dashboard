/**
 * CHAT_INTELLIGENCE_ENGINE_V1
 * --------------------------
 * Phase 6.8 — Engine-only multi-engine synthesis
 * Phase 6.9 — Persistent intelligence memory (read-only)
 * Phase 6.9.1 — Intent-scoped portfolio risk lenses
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
    return {
      samples: INTELLIGENCE_MEMORY.length,
      unstable: false,
      observedStates: [],
    };
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
   PORTFOLIO RISK LENS (NEW)
========================================================= */

function detectPortfolioLens(query) {
  const q = query.toLowerCase();

  if (q.includes("rate") || q.includes("interest")) {
    return "RATE_SENSITIVITY";
  }

  if (q.includes("risk-off") || q.includes("drawdown") || q.includes("crash")) {
    return "RISK_OFF_EXPOSURE";
  }

  if (q.includes("leverage") || q.includes("margin")) {
    return "LEVERAGE_SENSITIVITY";
  }

  if (q.includes("concentrated") || q.includes("concentration")) {
    return "CONCENTRATION";
  }

  return "GENERAL_EXPOSURE";
}

/* =========================================================
   MAIN ENGINE
========================================================= */

export async function runChatIntelligence(query = "") {
  const routing = routeChatQuery(query);

  let market = null;
  let portfolio = null;
  let decision = null;

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

  const summary = [];
  const perspectives = [];

  /* -----------------------------
     MARKET PERSPECTIVE
  ----------------------------- */
  if (market) {
    summary.push(
      `Market regime is ${market.regime.state} with ${(market.regime.confidence * 100).toFixed(0)}% confidence.`
    );

    perspectives.push({
      source: "market",
      regime: market.regime.state,
      confidence: market.regime.confidence,
      favoredAssets: market.implications.favoredAssets,
      pressuredAssets: market.implications.pressuredAssets,
    });
  }

  /* -----------------------------
     PORTFOLIO PERSPECTIVE
  ----------------------------- */
  if (portfolio) {
    summary.push(
      `Your portfolio holds ${portfolio.holdings.length} positions with ${portfolio.currency} exposure.`
    );

    perspectives.push({
      source: "portfolio",
      topHolding: portfolio.holdings[0]?.symbol || null,
      assetMix: [...new Set(portfolio.holdings.map(h => h.assetClass))],
    });
  }

  /* -----------------------------
     DECISION PERSPECTIVE
  ----------------------------- */
  if (decision) {
    summary.push(
      `Decision posture is ${decision.assessment.posture} under a ${decision.assessment.regime} regime.`
    );

    perspectives.push({
      source: "decision",
      posture: decision.assessment.posture,
      regime: decision.assessment.regime,
      confidence: decision.assessment.confidence,
    });
  }

  /* -----------------------------
     SYNTHESIS STATE
  ----------------------------- */
  let synthesisState = "NEUTRAL";

  if (market && decision) {
    synthesisState =
      market.regime.state === decision.assessment.regime
        ? "ALIGNED"
        : "DIVERGENT";
  }

  if (synthesisState === "ALIGNED") {
    summary.push(
      "Independent engines converge on a consistent interpretation of current conditions."
    );
  }

  if (synthesisState === "DIVERGENT") {
    summary.push(
      "Engines present multiple valid interpretations under current conditions."
    );
  }

  /* =========================================================
     PORTFOLIO LENS SYNTHESIS (NEW)
  ========================================================= */

  if (routing.intent === "PORTFOLIO" && portfolio) {
    const lens = detectPortfolioLens(query);

    if (lens === "RATE_SENSITIVITY") {
      summary.push(
        "Rate-sensitive growth and crypto-linked holdings are most exposed to tightening conditions."
      );
    }

    if (lens === "RISK_OFF_EXPOSURE") {
      summary.push(
        "Higher-beta growth and crypto exposures would absorb the majority of downside in a risk-off regime."
      );
    }

    if (lens === "LEVERAGE_SENSITIVITY") {
      summary.push(
        "Leverage would amplify volatility given the portfolio’s growth and crypto tilt."
      );
    }

    if (lens === "CONCENTRATION") {
      summary.push(
        "Concentration risk is driven primarily by top equity and digital asset positions."
      );
    }
  }

  /* =========================================================
     MEMORY RECORD
  ========================================================= */

  recordIntelligenceSnapshot({
    timestamp: Date.now(),
    intent: routing.intent,
    confidence: routing.confidence,
    synthesisState,
    sources: routing.engines,
  });

  const memory = analyzeMemoryDrift();

  return {
    contract: "CHAT_INTELLIGENCE_V1",
    intent: routing.intent,
    confidence: routing.confidence,
    synthesisState,
    sources: routing.engines,
    perspectives,
    summary: summary.slice(0, 5),
    diagnostics: {
      marketLoaded: !!market,
      portfolioLoaded: !!portfolio,
      decisionLoaded: !!decision,
      memory,
    },
    timestamp: Date.now(),
  };
}
