const { parseIntent } = require("./intentParser");
const { assembleContext } = require("./contextAssembler");
const { computeConfidence } = require("./confidenceEngine");
const { composeResponse } = require("./responseComposer");
const { appendDecision } = require("./decisionLedger");

function processQuery(text, state) {
  const intent = parseIntent(text);
  const context = assembleContext(state);
  const confidence = computeConfidence(
    context.signalCount,
    state.volatility || 0,
    context.concentration.top1Pct || 0
  );

  const response = composeResponse(intent, { confidence });

  appendDecision({
    intent: intent.type,
    confidence,
    query: text,
  });

  return response;
}

module.exports = {
  processQuery,
};

