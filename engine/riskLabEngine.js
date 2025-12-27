// engine/riskLabEngine.js
// Phase 3 — Risk Centre (ENGINE ONLY)
// Pure, deterministic risk derivation
// INPUT: authoritative portfolio snapshot
// OUTPUT: risk metrics object
// NO side effects, NO IO, NO IPC

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export function buildRiskFromSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.positions)) {
    return {
      totalValue: 0,
      exposure: { equityPct: 0, cryptoPct: 0 },
      concentration: { top1Pct: 0, top3Pct: 0, top5Pct: 0 },
      flags: {
        highCryptoExposure: false,
        highConcentration: false
      }
    };
  }

  const positions = snapshot.positions;
  const totalValue = safeNum(snapshot.totals?.liveValue);

  if (totalValue <= 0) {
    return {
      totalValue: 0,
      exposure: { equityPct: 0, cryptoPct: 0 },
      concentration: { top1Pct: 0, top3Pct: 0, top5Pct: 0 },
      flags: {
        highCryptoExposure: false,
        highConcentration: false
      }
    };
  }

  // ── Exposure ─────────────────────────────
  let equityValue = 0;
  let cryptoValue = 0;

  for (const p of positions) {
    const v = safeNum(p.liveValue);
    if (p.assetClass === "crypto") cryptoValue += v;
    else equityValue += v;
  }

  const equityPct = equityValue / totalValue;
  const cryptoPct = cryptoValue / totalValue;

  // ── Concentration ────────────────────────
  const sorted = positions
    .map(p => safeNum(p.liveValue))
    .sort((a, b) => b - a);

  const sumTop = (n) =>
    sorted.slice(0, n).reduce((a, b) => a + b, 0) / totalValue;

  const top1Pct = sumTop(1);
  const top3Pct = sumTop(3);
  const top5Pct = sumTop(5);

  // ── Flags ─────────────────────────────────
  const flags = {
    highCryptoExposure: cryptoPct >= 0.60,
    highConcentration: top1Pct >= 0.40 || top3Pct >= 0.65
  };

  return {
    totalValue,
    exposure: {
      equityPct,
      cryptoPct
    },
    concentration: {
      top1Pct,
      top3Pct,
      top5Pct
    },
    flags
  };
}

