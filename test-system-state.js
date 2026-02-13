import { buildAwarenessState } from "./engine/intelligence/awarenessEngine.js";
import { interpretDecisionState } from "./engine/intelligence/decisionInterpreter.js";
import { assembleSignalsContext } from "./engine/intelligence/signalInterface.js";
import { normalizeRiskSnapshot } from "./engine/risk/index.js";
import { assembleIntelligenceContext } from "./engine/intelligence/contextAssembler.js";

const run = async () => {
  const awareness = await buildAwarenessState();
  const decision = await interpretDecisionState();
  const signals = await assembleSignalsContext();
  const ctx = await assembleIntelligenceContext();

  const risk = normalizeRiskSnapshot({
    positions: ctx.positions,
    totals: ctx.totals
  });

  console.log(JSON.stringify({
    awareness: !!awareness,
    decision: !!decision,
    signals: !!signals,
    risk: !!risk
  }, null, 2));
};

run();
