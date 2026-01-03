// engine/decision/decisionTTL.js
// Decision TTL Engine V2 — deterministic expiry enforcement

export function applyTTL({ asOf, decisions }) {
  const now = asOf;

  const valid = [];
  const expired = [];

  for (const d of decisions) {
    const ttlMs = d.ttlHours * 60 * 60 * 1000;
    const expiry = d.asOf + ttlMs;

    if (now <= expiry) {
      valid.push({
        ...d,
        expiresAt: expiry,
        status: "VALID"
      });
    } else {
      expired.push({
        ...d,
        expiresAt: expiry,
        status: "EXPIRED"
      });
    }
  }

  return {
    asOf: now,
    summary: {
      total: decisions.length,
      valid: valid.length,
      expired: expired.length
    },
    valid,
    expired
  };
}

