const { parseIntent } = require("./intentParser");
const { computeConfidence } = require("./confidenceEngine");
const { composeResponse } = require("./responseComposer");
const { appendDecision } = require("./decisionLedger");

function handleQuery(text, context) {
  const intent = parseIntent(text);

  const confidence = computeConfidence(
    context.signalCount,
    context.volatility,
    context.topConcentration
  );

  const response = composeResponse(intent, { confidence });

  appendDecision({
    intent: intent.type,
    confidence,
    text,
  });

  return response;
}

module.exports = {
  handleQuery,
};

