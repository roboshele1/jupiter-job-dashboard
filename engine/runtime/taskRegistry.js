// engine/runtime/taskRegistry.js
// Path B — Multi-Engine Autonomous Discovery (AUTHORITATIVE)
// -----------------------------------------------------------
// Defines ALL autonomous runtime tasks and their cadence.
// Runtime = scheduler + recorder only.
// No intelligence logic here.

import { valuePortfolio } from "../portfolio/portfolioValuation.js";

/**
 * DISCOVERY ENGINES (lazy-loaded)
 * - Lazy imports prevent boot-time coupling
 * - Each engine is isolated, autonomous, and observable
 */

async function runDiscoveryV1() {
  const discoveryModule = await import(
    "../discovery/runDiscoveryScan.js"
  );

  const runDiscoveryScan =
    discoveryModule.runDiscoveryScan ||
    discoveryModule.default?.runDiscoveryScan;

  if (typeof runDiscoveryScan !== "function") {
    throw new Error("DISCOVERY_V1_INVALID");
  }

  return runDiscoveryScan();
}

async function runEmergingThemes() {
  const themeModule = await import(
    "../discovery/orchestrator/discoveryThemeOrchestrator.js"
  );

  const buildThemes =
    themeModule.buildThemes ||
    themeModule.default?.buildThemes;

  if (typeof buildThemes !== "function") {
    throw new Error("DISCOVERY_THEMES_INVALID");
  }

  return buildThemes();
}

async function runRankedDiscovery() {
  const rankedModule = await import(
    "../discovery/ranking/rankedDiscoveryEngine.js"
  );

  const runRankedDiscoveryEngine =
    rankedModule.runRankedDiscoveryEngine ||
    rankedModule.default?.runRankedDiscoveryEngine;

  if (typeof runRankedDiscoveryEngine !== "function") {
    throw new Error("DISCOVERY_RANKED_INVALID");
  }

  return runRankedDiscoveryEngine();
}

/**
 * TASK REGISTRY — AUTHORITATIVE
 * -----------------------------
 * - Discovery V1 retained for safety and debugging
 * - Ranked Discovery is now a first-class autonomous engine
 * - Themes remains autonomous
 * - Trajectory intentionally excluded (matcher ≠ engine)
 */

export const TASKS = [
  // ─────────────────────────────────────────────
  // CORE — PORTFOLIO (unchanged)
  // ─────────────────────────────────────────────
  {
    key: "portfolio",
    intervalMs: 10_000,
    run: async () => {
      return valuePortfolio();
    }
  },

  // ─────────────────────────────────────────────
  // DISCOVERY V1 — LEGACY / COMPOSITE
  // (Fallback, debugging, full sweep)
  // ─────────────────────────────────────────────
  {
    key: "discovery.v1",
    intervalMs: 15 * 60 * 1000,
    run: async () => {
      return runDiscoveryV1();
    }
  },

  // ─────────────────────────────────────────────
  // PATH B — EMERGING THEMES (SLOW, HEAVY)
  // Cadence: 6 hours (2 / 6 / 12 configurable later)
  // ─────────────────────────────────────────────
  {
    key: "discovery.themes",
    intervalMs: 6 * 60 * 60 * 1000,
    run: async () => {
      return runEmergingThemes();
    }
  },

  // ─────────────────────────────────────────────
  // PATH B — RANKED MARKET DISCOVERY (MEDIUM)
  // Cadence: 45 minutes
  // ─────────────────────────────────────────────
  {
    key: "discovery.ranked",
    intervalMs: 45 * 60 * 1000,
    run: async () => {
      return runRankedDiscovery();
    }
  }
];

