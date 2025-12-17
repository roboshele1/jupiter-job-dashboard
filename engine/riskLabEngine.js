// engine/riskLabEngine.js
// Risk Lab Engine — read-only, deterministic, IPC-safe
// Purpose: surface portfolio risk diagnostics without mutation

const portfolioEngine = require("./portfolioEngine");

function nowIso() {
  return new Date().toISOString();
}

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function round(n, d = 2) {
  const m = Math.pow(10, d);
  return Math.round(safeNumber(n) * m) / m;
}

function buildRiskFromSnapshot(snapshot) {
  const totals = snapshot?.totals || {};
  const allocation = snapshot?.allocation || {};
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];

  const portfolioValue = safeNumber(totals.portfolioValue);
  const dailyPLPercent = safeNumber(totals.dailyPLPercent);

  // Concentration
  const byValue = rows
    .map((r) => ({ symbol: r.symbol, value: safeNumber(r.value) }))
    .sort((a, b) => b.value - a.value);

  const top1 = byValue[0];
  const top3 = byValue.slice(0, 3);

  const top1Pct = portfolioValue
    ? round((safeNumber(top1?.value) / portfolioValue) * 100)
    : 0;

  const top3Pct = portfolioValue
    ? round(
        (top3.reduce((s, r) => s + safeNumber(r.value), 0) / portfolioValue) *
          100
      )
    : 0;

  const flags = [];
  if (top1Pct >= 35)
    flags.push({
      code: "CONCENTRATION_TOP1",
      level: "warn",
      detail: `Top holding ${top1Pct}%`,
    });

  if (top3Pct >= 70)
    flags.push({
      code: "CONCENTRATION_TOP3",
      level: "warn",
      detail: `Top 3 holdings ${top3Pct}%`,
    });

  if (Math.abs(dailyPLPercent) >= 3)
    flags.push({
      code: "DAILY_VOLATILITY",
      level: "info",
      detail: `Daily move ${round(dailyPLPercent, 2)}%`,
    });

  return {
    ts: nowIso(),
    summary: {
      portfolioValue: round(portfolioValue),
      top1Pct,
      top3Pct,
      equityPct: round(safeNumber(allocation.equity)),
      cryptoPct: round(safeNumber(allocation.crypto)),
    },
    flags,
  };
}

async function getRiskSnapshot() {
  const snapshot = await portfolioEngine.getSnapshot();
  return buildRiskFromSnapshot(snapshot);
}

module.exports = {
  getRiskSnapshot,
};

