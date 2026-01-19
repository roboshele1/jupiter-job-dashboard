// engine/runtime/taskRegistry.js
// Path B — Multi-Engine Autonomous Discovery (AUTHORITATIVE)
// -----------------------------------------------------------
// Scheduler ONLY. No intelligence logic.
// Append-only evolution. Deterministic execution.

import { valuePortfolio } from "../portfolio/portfolioValuation.js";

/* ─────────────────────────────────────────────
   DISCOVERY ENGINES (LAZY-LOADED)
   ───────────────────────────────────────────── */

async function runDiscoveryV1() {
  const m = await import("../discovery/runDiscoveryScan.js");
  const fn = m.runDiscoveryScan || m.default?.runDiscoveryScan;
  if (typeof fn !== "function") throw new Error("DISCOVERY_V1_INVALID");
  return fn();
}

async function runEmergingThemes() {
  const m = await import("../discovery/orchestrator/discoveryThemeOrchestrator.js");
  const fn = m.buildThemes || m.default?.buildThemes;
  if (typeof fn !== "function") throw new Error("DISCOVERY_THEMES_INVALID");
  return fn();
}

async function runRankedDiscovery() {
  const m = await import("../discovery/ranking/rankedDiscoveryEngine.js");
  const fn =
    m.runRankedDiscoveryEngine || m.default?.runRankedDiscoveryEngine;
  if (typeof fn !== "function") throw new Error("DISCOVERY_RANKED_INVALID");
  return fn();
}

async function runWatchlistTrajectory() {
  const m = await import("../watchlist/runWatchlistTrajectoryScan.js");
  const fn =
    m.runWatchlistTrajectoryScan ||
    m.default?.runWatchlistTrajectoryScan;
  if (typeof fn !== "function") {
    throw new Error("WATCHLIST_TRAJECTORY_INVALID");
  }
  return fn();
}

/* ─────────────────────────────────────────────
   TASK REGISTRY — AUTHORITATIVE
   ───────────────────────────────────────────── */

export const TASKS = [
  // CORE — PORTFOLIO
  {
    key: "portfolio",
    intervalMs: 10_000,
    run: async () => valuePortfolio()
  },

  // DISCOVERY V1 — LEGACY / SAFETY
  {
    key: "discovery.v1",
    intervalMs: 15 * 60 * 1000,
    run: async () => runDiscoveryV1()
  },

  // PATH B — EMERGING THEMES (HEAVY)
  {
    key: "discovery.themes",
    intervalMs: 6 * 60 * 60 * 1000,
    run: async () => runEmergingThemes()
  },

  // PATH B — RANKED MARKET DISCOVERY (PRIMARY)
  {
    key: "discovery.ranked",
    intervalMs: 45 * 60 * 1000,
    run: async () => runRankedDiscovery()
  },

  // PATH B — WATCHLIST TRAJECTORY (DERIVED)
  {
    key: "watchlist.trajectory",
    intervalMs: 90 * 60 * 1000,
    run: async () => runWatchlistTrajectory()
  }
];

