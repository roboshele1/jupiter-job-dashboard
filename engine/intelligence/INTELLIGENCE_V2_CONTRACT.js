/**
 * INTELLIGENCE_V2_CONTRACT
 * =======================
 * Phase 10.1 — Intelligence Contract Definition
 *
 * Purpose:
 * - Define the canonical output shape for ALL V2 intelligence
 * - Enforce explainability, confidence, and provenance
 * - Prevent opaque or non-deterministic responses
 *
 * This file contains:
 * - NO computation
 * - NO orchestration
 * - NO engine logic
 *
 * It is a STRUCTURAL CONTRACT ONLY.
 */

/* =========================================================
   CONTRACT VERSION
========================================================= */

export const INTELLIGENCE_CONTRACT_VERSION = "INTELLIGENCE_V2";

/* =========================================================
   INTELLIGENCE OUTPUT SHAPE
========================================================= */

/**
 * @typedef {Object} IntelligenceInsight
 */
export const IntelligenceInsight = {
  // Identity
  contract: INTELLIGENCE_CONTRACT_VERSION,
  domain: null, // e.g. "GROWTH", "RISK", "PORTFOLIO", "MARKET"
  insightType: null, // e.g. "FEASIBILITY", "CONSTRAINT", "ANOMALY"

  // Core message (human-readable, but deterministic)
  summary: null,

  // Structured explanation (machine + human readable)
  explanation: {
    rationale: null,        // Why this insight exists
    drivers: [],            // Key variables that influenced it
    assumptions: [],        // Explicit assumptions
    exclusions: [],         // What this insight does NOT consider
  },

  // Evidence & provenance
  evidence: {
    sources: [],            // Engines / snapshots used
    snapshotTimestamp: null,
    dataFreshness: null,    // e.g. "LIVE", "SNAPSHOT", "STALE"
  },

  // Confidence & uncertainty
  confidence: {
    level: null,            // LOW | MEDIUM | HIGH
    score: null,            // 0.0 → 1.0
    uncertaintyDrivers: [], // What could change this insight
  },

  // Governance & permissions
  governance: {
    adviceAllowed: false,
    executionAllowed: false,
    reasoningAllowed: true,
  },

  // Metadata
  metadata: {
    generatedAt: null,
    engineVersion: null,
    authority: null,
  },
};

/* =========================================================
   CONTRACT EXPORT (IMMUTABLE)
========================================================= */

export function createEmptyIntelligenceInsight() {
  return JSON.parse(JSON.stringify(IntelligenceInsight));
}
