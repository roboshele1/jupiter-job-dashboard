// engine/decision/decisionTTL.js

export function applyTTL(input) {
  if (!input) {
    throw new Error("Invalid TTL input");
  }

  const decisions = Array.isArray(input)
    ? input
    : Array.isArray(input.decisions)
    ? input.decisions
    : null;

  if (!decisions) {
    throw new Error("Invalid TTL input");
  }

  const asOf = input.asOf ?? Date.now();

  const out = decisions.map((d) => {
    const ttlHours =
      typeof d.ttlHours === "number" && Number.isFinite(d.ttlHours)
        ? d.ttlHours
        : 12;

    const expiresAt = asOf + ttlHours * 60 * 60 * 1000;

    return {
      ...d,
      ttlHours,
      expiresAt,
      isExpired: Date.now() > expiresAt
    };
  });

  return Array.isArray(input)
    ? out
    : {
        ...input,
        asOf,
        decisions: out
      };
}

