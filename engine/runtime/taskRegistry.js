// engine/runtime/taskRegistry.js
// Defines what runs and how often
// Runtime-safe, lazy-loaded intelligence tasks

import { valuePortfolio } from "../portfolio/portfolioValuation.js";

/**
 * NOTE:
 * - Portfolio is core runtime → eager
 * - Discovery is heavy intelligence → lazy-loaded
 * - This prevents ESM/CJS boot-time failures
 */

export const TASKS = [
  {
    key: "portfolio",
    intervalMs: 10_000,
    run: async () => {
      return valuePortfolio();
    }
  },

  {
    key: "discovery",
    intervalMs: 15 * 60 * 1000,
    run: async () => {
      // Lazy import to avoid runtime boot coupling
      const discoveryModule = await import(
        "../discovery/runDiscoveryScan.js"
      );

      const runDiscoveryScan =
        discoveryModule.runDiscoveryScan ||
        discoveryModule.default?.runDiscoveryScan;

      if (typeof runDiscoveryScan !== "function") {
        throw new Error("DISCOVERY_TASK_INVALID");
      }

      return runDiscoveryScan();
    }
  }
];
