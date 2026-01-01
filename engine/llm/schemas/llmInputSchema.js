/**
 * LLM Input Schema — Phase 8
 * --------------------------
 * Purpose:
 * - Define the ONLY valid shape of data that may enter the LLM sandbox
 * - Enforce strict, minimal, read-only inputs
 * - Prevent hidden context, instructions, or behavior drift
 *
 * IMPORTANT:
 * - Schema only (no execution)
 * - No imports from engines, IPC, UI, or filesystem
 * - Pure validation logic
 */

/**
 * Validate input passed into LLM sandbox
 * Returns a normalized, safe payload or throws on violation
 */
export function validateLLMInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("LLM Input Schema Violation: input must be an object");
  }

  // System invariants
  if (
    input.system?.mode !== "observer" ||
    input.system?.sandboxed !== true
  ) {
    throw new Error(
      "LLM Input Schema Violation: system must be observer-mode and sandboxed"
    );
  }

  // Payload must be a controlled Chat exposure object
  const payload = input.payload;
  if (!payload || typeof payload !== "object") {
    throw new Error("LLM Input Schema Violation: payload missing or invalid");
  }

  // Allowed fields ONLY
  const allowedKeys = [
    "synthesisSummary",
    "dominantRiskDriver",
    "firstFailureMode",
    "growthAlignment",
    "disclaimer",
  ];

  Object.keys(payload).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      throw new Error(
        `LLM Input Schema Violation: forbidden field "${key}"`
      );
    }
  });

  // Type enforcement
  if (
    payload.synthesisSummary !== null &&
    typeof payload.synthesisSummary !== "string"
  ) {
    throw new Error("LLM Input Schema Violation: synthesisSummary must be string or null");
  }

  if (
    payload.dominantRiskDriver !== null &&
    typeof payload.dominantRiskDriver !== "string"
  ) {
    throw new Error("LLM Input Schema Violation: dominantRiskDriver must be string or null");
  }

  if (
    payload.firstFailureMode !== null &&
    typeof payload.firstFailureMode !== "string"
  ) {
    throw new Error("LLM Input Schema Violation: firstFailureMode must be string or null");
  }

  if (
    payload.growthAlignment !== "aligned" &&
    payload.growthAlignment !== "misaligned" &&
    payload.growthAlignment !== "unknown"
  ) {
    throw new Error(
      "LLM Input Schema Violation: growthAlignment invalid"
    );
  }

  if (typeof payload.disclaimer !== "string") {
    throw new Error("LLM Input Schema Violation: disclaimer must be string");
  }

  // Return normalized, safe object
  return {
    system: {
      phase: 8,
      mode: "observer",
      validated: true,
    },
    payload,
  };
}

