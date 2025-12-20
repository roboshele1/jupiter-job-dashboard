/**
 * Growth Scanner
 * --------------
 * Compares companies to archetypes.
 */

import { compareTrajectory } from "./trajectoryEngine";
import { ARCHETYPES } from "./archetypes";

export function scanGrowth(companySeries) {
  const results = {};

  for (const [name, archetype] of Object.entries(ARCHETYPES)) {
    results[name] = compareTrajectory(companySeries, archetype);
  }

  return results;
}

