/**
 * CHAT_INTELLIGENCE_ENGINE_V1
 * --------------------------
 * Phase 6.8 — Engine-only multi-engine synthesis
 * Deterministic, stateless, read-only
 */

import { routeChatQuery } from "./queryRouter.js";
import { getGlobalMarketIntelligence } from "../market/marketIntelligence.js";
import { getAuthoritativePortfolio } from "../portfolio/portfolioAuthority.js";
import { runDecisionEngine } from "../decision/decisionEngine.js";

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

  // -----------------------------
  // MARKET PERSPECTIVE
  // -----------------------------
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

  // -----------------------------
  // PORTFOLIO PERSPECTIVE
  // -----------------------------
  if (portfolio) {
    summary.push(
      `Your portfolio holds ${portfolio.holdings.length} positions with ${portfolio.currency} exposure.`
    );

    perspectives.push({
      source: "portfolio",
      topHolding: portfolio.holdings[0]?.symbol || null,
      positionCount: portfolio.holdings.length,
      assetMix: [...new Set(portfolio.holdings.map(h => h.assetClass))],
    });
  }

  // -----------------------------
  // DECISION PERSPECTIVE
  // -----------------------------
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

  // -----------------------------
  // SYNTHESIS STATE
  // -----------------------------
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
    },
    timestamp: Date.now(),
  };
}
