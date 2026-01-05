/**
 * CHAT_V2_SYNTHESIS_ENGINE
 * =======================
 * Phase 10.4 — Synthesis layer (contract-first, engine-only)
 *
 * PURPOSE
 * -------
 * - Merge Chat V2 Intelligence (10.2) + Reasoning (10.3) into ONE UI-ready envelope
 * - Preserve read-only, deterministic, non-executing guarantees
 * - Provide a single “assistant response object” without doing any new analysis
 *
 * NON-GOALS
 * ---------
 * - No LLM calls
 * - No execution
 * - No advice
 * - No portfolio mutation
 * - No IPC exposure
 * - No additional reasoning (only merge/shape)
 */

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_SYNTHESIS_CONTRACT = {
  name: "CHAT_V2_SYNTHESIS",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INPUT SHAPE
========================================================= */
/**
 * Expected input:
 * {
 *   intelligenceResult: {
 *     contract: string,
 *     status: string,
 *     intent: string,
 *     confidence: number,
 *     intelligence: {
 *       summary: string[],
 *       observations: string[],
 *       risks: string[],
 *       constraints: string[]
 *     },
 *     timestamp: number
 *   },
 *   reasoningResult: {
 *     contract: string,
 *     status: string,
 *     intent: string,
 *     reasoning: {
 *       assumptions: string[],
 *       logicalSteps: string[],
 *       exclusions: string[],
 *       confidenceDrivers: string[]
 *     },
 *     timestamp: number
 *   },
 *   meta?: {
 *     query?: string,
 *     requestId?: string,
 *     provenance?: object
 *   }
 * }
 */

/* =========================================================
   OUTPUT SHAPE (UI-READY)
========================================================= */
/**
 * Returned structure:
 * {
 *   contract: string,
 *   status: string,
 *   intent: string | null,
 *   confidence: number,
 *   response: {
 *     headline: string,
 *     bullets: string[],
 *     sections: {
 *       summary: string[],
 *       observations: string[],
 *       risks: string[],
 *       reasoning: {
 *         assumptions: string[],
 *         logicalSteps: string[],
 *         exclusions: string[],
 *         confidenceDrivers: string[]
 *       },
 *       constraints: string[]
 *     }
 *   },
 *   governance: {
 *     executionAllowed: false,
 *     adviceAllowed: false,
 *     mutationAllowed: false
 *   },
 *   timestamps: {
 *     intelligence: number | null,
 *     reasoning: number | null,
 *     synthesized: number
 *   },
 *   meta: {
 *     query?: string,
 *     requestId?: string
 *   }
 * }
 */

/* =========================================================
   HELPERS (NO LOGIC — SHAPE ONLY)
========================================================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeNumber(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function inferStatus(intelStatus, reasoningStatus) {
  // Deterministic merge rule (no analysis):
  // - READY only if BOTH are READY
  // - otherwise INCOMPLETE
  if (intelStatus === "READY" && reasoningStatus === "READY") return "READY";
  return "INCOMPLETE";
}

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Synthesis({
  intelligenceResult,
  reasoningResult,
  meta = {},
} = {}) {
  const hasIntel = !!intelligenceResult;
  const hasReasoning = !!reasoningResult;

  if (!hasIntel || !hasReasoning) {
    return {
      contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent: (intelligenceResult && intelligenceResult.intent) || (reasoningResult && reasoningResult.intent) || null,
      confidence: 0,
      response: {
        headline: "Chat V2 synthesis unavailable",
        bullets: [
          "Missing intelligence and/or reasoning payload.",
          "Synthesis requires both layers to produce a UI-ready envelope.",
        ],
        sections: {
          summary: safeArray(intelligenceResult?.intelligence?.summary),
          observations: safeArray(intelligenceResult?.intelligence?.observations),
          risks: safeArray(intelligenceResult?.intelligence?.risks),
          reasoning: {
            assumptions: safeArray(reasoningResult?.reasoning?.assumptions),
            logicalSteps: safeArray(reasoningResult?.reasoning?.logicalSteps),
            exclusions: safeArray(reasoningResult?.reasoning?.exclusions),
            confidenceDrivers: safeArray(reasoningResult?.reasoning?.confidenceDrivers),
          },
          constraints: [
            ...safeArray(intelligenceResult?.intelligence?.constraints),
            "Synthesis requires both intelligence + reasoning.",
            "Execution disabled by contract.",
            "Advice disabled by contract.",
          ],
        },
      },
      governance: {
        executionAllowed: false,
        adviceAllowed: false,
        mutationAllowed: false,
      },
      timestamps: {
        intelligence: safeNumber(intelligenceResult?.timestamp, null),
        reasoning: safeNumber(reasoningResult?.timestamp, null),
        synthesized: Date.now(),
      },
      meta: {
        ...(meta?.query ? { query: meta.query } : {}),
        ...(meta?.requestId ? { requestId: meta.requestId } : {}),
      },
    };
  }

  const intent = intelligenceResult.intent || reasoningResult.intent || null;
  const confidence = safeNumber(intelligenceResult.confidence, 0);

  const intelStatus = intelligenceResult.status || "UNKNOWN";
  const reasoningStatus = reasoningResult.status || "UNKNOWN";
  const status = inferStatus(intelStatus, reasoningStatus);

  const summary = safeArray(intelligenceResult.intelligence?.summary);
  const observations = safeArray(intelligenceResult.intelligence?.observations);
  const risks = safeArray(intelligenceResult.intelligence?.risks);
  const constraints = safeArray(intelligenceResult.intelligence?.constraints);

  const reasoning = {
    assumptions: safeArray(reasoningResult.reasoning?.assumptions),
    logicalSteps: safeArray(reasoningResult.reasoning?.logicalSteps),
    exclusions: safeArray(reasoningResult.reasoning?.exclusions),
    confidenceDrivers: safeArray(reasoningResult.reasoning?.confidenceDrivers),
  };

  // UI headline is deterministic: use first summary line if present, else static fallback.
  const headline = summary[0] || "Chat V2 synthesis ready";

  // UI bullets: deterministic, capped, no analysis — just select from existing arrays.
  const bullets = []
    .concat(summary.slice(0, 2))
    .concat(observations.slice(0, 2))
    .slice(0, 4);

  return {
    contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
    status,
    intent,
    confidence,
    response: {
      headline,
      bullets,
      sections: {
        summary,
        observations,
        risks,
        reasoning,
        constraints: [
          ...constraints,
          "Execution disabled by contract.",
          "Advice disabled by contract.",
          "Mutation disabled by contract.",
        ],
      },
    },
    governance: {
      executionAllowed: false,
      adviceAllowed: false,
      mutationAllowed: false,
    },
    timestamps: {
      intelligence: safeNumber(intelligenceResult.timestamp, null),
      reasoning: safeNumber(reasoningResult.timestamp, null),
      synthesized: Date.now(),
    },
    meta: {
      ...(meta?.query ? { query: meta.query } : {}),
      ...(meta?.requestId ? { requestId: meta.requestId } : {}),
    },
  };
}
