/**
 * Conviction Integration Engine
 * -----------------------------
 * Composes Conviction Evolution outputs for Insights authority.
 *
 * Read-only. Deterministic. Signal-free.
 */

import { buildConvictionEvolution } from "./convictionEvolutionEngine.js";

export function runConvictionIntegration({ confidence, symbols = [] }) {
  if (!confidence || !Array.isArray(symbols)) return [];

  const rows = [];

  for (const symbol of symbols) {
    const out = buildConvictionEvolution({
      symbol,
      confidence
    });

    if (Array.isArray(out) && out.length) {
      rows.push(...out);
    }
  }

  return rows;
}
