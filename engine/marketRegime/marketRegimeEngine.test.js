import { computeMarketRegime } from "./marketRegimeEngine.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/* ===============================
   TEST: RISK ON
   =============================== */
const riskOnInput = {
  vixLevel: 15,
  breadthPctAbove50DMA: 72,
  indexTrend: "UP"
};

const riskOnResult = computeMarketRegime(riskOnInput);
console.log("RISK_ON:", riskOnResult);

assert(riskOnResult.regime === "RISK_ON", "Expected RISK_ON regime");
assert(riskOnResult.confidence === "HIGH", "Expected HIGH confidence");

/* ===============================
   TEST: RISK OFF
   =============================== */
const riskOffInput = {
  vixLevel: 32,
  breadthPctAbove50DMA: 28,
  indexTrend: "DOWN"
};

const riskOffResult = computeMarketRegime(riskOffInput);
console.log("RISK_OFF:", riskOffResult);

assert(riskOffResult.regime === "RISK_OFF", "Expected RISK_OFF regime");
assert(riskOffResult.confidence === "HIGH", "Expected HIGH confidence");

/* ===============================
   TEST: TRANSITION
   =============================== */
const transitionInput = {
  vixLevel: 22,
  breadthPctAbove50DMA: 52,
  indexTrend: "SIDEWAYS"
};

const transitionResult = computeMarketRegime(transitionInput);
console.log("TRANSITION:", transitionResult);

assert(
  transitionResult.regime === "TRANSITION",
  "Expected TRANSITION regime"
);
assert(
  transitionResult.confidence === "LOW",
  "Expected LOW confidence"
);

console.log("✅ Market Regime Engine V1 tests passed");

