const { parseIntent } = require("./intentParser");
const { computeConfidence } = require("./confidenceEngine");
const { composeResponse } = require("./responseComposer");
const { appendDecision } = require("./decisionLedger");

function runEngine(input, context) {
  const intent = parseIntent(input);
  const confidence = computeConfidence(
    context.signalCount,
    context.volatility,
    context.concentration
  );

  const response = composeResponse(intent, { confidence });

  appendDecision({
    input,
    intent,
    response,
  });

  return response;
}

module.exports = {
  runEngine,
};

