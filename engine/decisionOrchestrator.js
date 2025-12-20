const { parseIntent } = require("./intentParser");
const { composeResponse } = require("./responseComposer");
const { appendDecision } = require("./decisionLedger");
const { computeConfidence } = require("./confidenceEngine");

function handleQuery(text, context) {
  const intent = parseIntent(text);
  const confidence = computeConfidence(
    context.signalCount,
    context.volatility,
    context.concentration
  );

  const response = composeResponse(intent, {
    ...context,
    confidence,
  });

  appendDecision({ text, intent, confidence });

  return { intent, confidence, response };
}

module.exports = {
  handleQuery,
};

