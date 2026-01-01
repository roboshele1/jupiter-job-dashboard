/**
 * LLM Output Schema — Phase 8
 * --------------------------
 * Purpose:
 * - Define the ONLY valid shape of data an LLM may return
 * - Prevent advice, actions, predictions, or free-form reasoning
 * - Enforce observer-only, read-only responses
 *
 * IMPORTANT:
 * - Schema + validation ONLY (no execution)
 * - No imports from engines, IPC, UI, or filesystem
 * - Deterministic validation
 */

/**
 * Validate output returned from LLM sandbox
 * Returns a normalized, safe response or throws on violation
 */
export function validateLLMOutput(output) {
  if (!output || typeof output !== "object") {
    throw new Error("LLM Output Schema Violation: output must be an object");
  }

  // Required top-level fields
  const requiredKeys = ["summary", "metadata", "disclaimer"];
  requiredKeys.forEach((key) => {
    if (!(key in output)) {
      throw new Error(
        `LLM Output Schema Violation: missing required field "${key}"`
      );
    }
  });

  // Summary: descriptive only
  if (typeof output.summary !== "string") {
    throw new Error(
      "LLM Output Schema Violation: summary must be a string"
    );
  }

  // Metadata: strict observer-mode contract
  const metadata = output.metadata;
  if (
    !metadata ||
    metadata.mode !== "observer" ||
    metadata.phase !== 8
  ) {
    throw new Error(
      "LLM Output Schema Violation: metadata must declare observer mode and phase 8"
    );
  }

  // Explicitly forbidden content flags
  const forbiddenFlags = [
    "advice",
    "recommendation",
    "prediction",
    "instruction",
    "command",
    "optimization",
  ];

  forbiddenFlags.forEach((flag) => {
    if (metadata[flag] === true) {
      throw new Error(
        `LLM Output Schema Violation: forbidden capability "${flag}" detected`
      );
    }
  });

  // Disclaimer must be present and string
  if (typeof output.disclaimer !== "string") {
    throw new Error(
      "LLM Output Schema Violation: disclaimer must be a string"
    );
  }

  // Return normalized safe output
  return {
    summary: output.summary,
    metadata: {
      mode: "observer",
      phase: 8,
      validated: true,
    },
    disclaimer: output.disclaimer,
  };
}

