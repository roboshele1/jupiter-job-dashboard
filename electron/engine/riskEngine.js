/**
 * JUPITER — Risk & Concentration Engine (V1)
 * STEP 4A: Read-only risk derivation
 * INPUT: Canonical portfolio snapshot (V1_3B)
 * OUTPUT: Deterministic risk object
 *
 * RULES:
 * - NO mutation of snapshot
 * - NO UI math
 * - Engine-only
 * - Additive intelligence
 */

function computeRisk(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.positions)) {
    return {
      contract: "JUPITER_RISK_V1",
      valid: false,
      error: "Invalid snapshot input",
    };
  }

  const positions = snapshot.positions;
  const totalValue = snapshot.totalValue || 0;

  // ---- Concentration ----
  const sorted = [...positions].sort(
    (a, b) => b.marketValue - a.marketValue
  );

  const topHolding = sorted[0] || null;

  const sumTopN = (n) =>
    sorted.slice(0, n).reduce((acc, p) => acc + p.marketValue, 0);

  const top1Pct = totalValue ? Number(((sumTopN(1) / totalValue) * 100).toFixed(2)) : 0;
  const top3Pct = totalValue ? Number(((sumTopN(3) / totalValue) * 100).toFixed(2)) : 0;
  const top5Pct = totalValue ? Number(((sumTopN(5) / totalValue) * 100).toFixed(2)) : 0;

  // ---- Asset Class Exposure ----
  const equityValue = snapshot.equityValue || 0;
  const cryptoValue = snapshot.cryptoValue || 0;

  const equityPct = snapshot.equityPct || 0;
  const cryptoPct = snapshot.cryptoPct || 0;

  // ---- Flags (read-only) ----
  const flags = [];

  if (top1Pct > 30) flags.push("TOP_HOLDING_OVER_30%");
  if (top3Pct > 60) flags.push("TOP_3_OVER_60%");
  if (cryptoPct > 35) flags.push("CRYPTO_OVER_35%");
  if (positions.length < 8) flags.push("LOW_DIVERSIFICATION");

  return {
    contract: "JUPITER_RISK_V1",
    timestamp: Date.now(),
    valid: true,

    concentration: {
      topHolding: topHolding
        ? {
            symbol: topHolding.symbol,
            allocationPct: top1Pct,
          }
        : null,
      top1Pct,
      top3Pct,
      top5Pct,
    },

    exposure: {
      equityValue: Number(equityValue.toFixed(2)),
      cryptoValue: Number(cryptoValue.toFixed(2)),
      equityPct,
      cryptoPct,
    },

    meta: {
      positionCount: positions.length,
      flags,
    },
  };
}

module.exports = { computeRisk };

