// engine/risk/riskEngine.js

import fs from "fs/promises";
import path from "path";

const SNAPSHOT_FILE = path.resolve(
  process.cwd(),
  "engine/portfolio/snapshots/latest.json"
);

export async function deriveRiskSnapshot() {
  let snapshot;

  try {
    const raw = await fs.readFile(SNAPSHOT_FILE, "utf-8");
    snapshot = JSON.parse(raw);
  } catch {
    return {
      contract: "RISK_SNAPSHOT_V1",
      status: "NO_PORTFOLIO_SNAPSHOT",
      metrics: {},
    };
  }

  const { positions = [], totals = {} } = snapshot;

  if (!positions.length || !totals.liveValue) {
    return {
      contract: "RISK_SNAPSHOT_V1",
      status: "EMPTY_PORTFOLIO",
      metrics: {},
    };
  }

  const totalValue = totals.liveValue;

  const weights = positions.map(p => ({
    symbol: p.symbol,
    weightPct: +(p.liveValue / totalValue * 100).toFixed(2),
  }));

  weights.sort((a, b) => b.weightPct - a.weightPct);

  const top = weights[0];

  const btcExposure = weights.find(w => w.symbol === "BTC")?.weightPct ?? 0;

  return {
    contract: "RISK_SNAPSHOT_V1",
    status: "OK",
    metrics: {
      topHolding: top.symbol,
      topHoldingWeightPct: top.weightPct,
      btcExposurePct: btcExposure,
      concentrationFlag: top.weightPct > 35,
      btcDominanceFlag: btcExposure > 25,
      weights,
    },
  };
}

