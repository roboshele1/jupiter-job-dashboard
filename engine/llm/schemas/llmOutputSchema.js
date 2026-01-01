/**
 * LLM Output Schema — Canonical
 * ----------------------------
 * Purpose:
 * - Validate observer-only LLM output
 * - Allow forward-compatible phases
 */

export function validateLLMOutput(output) {
  if (!output || typeof output !== "object") {
    throw new Error("LLM Output Schema Violation: output must be an object");
  }

  const requiredKeys = ["summary", "metadata", "disclaimer"];
  for (const key of requiredKeys) {
    if (!(key in output)) {
      throw new Error(
        `LLM Output Schema Violation: missing required field "${key}"`
      );
    }
  }

  if (typeof output.summary !== "string") {
    throw new Error("LLM Output Schema Violation: summary must be a string");
  }

  const metadata = output.metadata;

  if (
    !metadata ||
    metadata.mode !== "observer" ||
    typeof metadata.phase !== "number"
  ) {
    throw new Error(
      "LLM Output Schema Violation: metadata must declare observer mode and numeric phase"
    );
  }

  const forbiddenFlags = [
    "advice",
    "recommendation",
    "prediction",
    "instruction",
    "command",
    "optimization",
  ];

  for (const flag of forbiddenFlags) {
    if (metadata[flag] === true) {
      throw new Error(
        `LLM Output Schema Violation: forbidden capability "${flag}" detected`
      );
    }
  }

  if (typeof output.disclaimer !== "string") {
    throw new Error("LLM Output Schema Violation: disclaimer must be a string");
  }

  return {
    summary: output.summary,
    metadata: {
      mode: "observer",
      phase: metadata.phase,
      validated: true,
    },
    disclaimer: output.disclaimer,
  };
}

