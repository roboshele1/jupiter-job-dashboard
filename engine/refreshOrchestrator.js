const { portfolioEngine, learningRegistry } = require("./index");
const { extractFeatures } = require("./features/featureExtractor");

function refreshAll() {
  const snapshot = portfolioEngine.getSnapshot();

  learningRegistry.recordEvent({
    type: "PORTFOLIO_SNAPSHOT",
    payload: snapshot
  });

  const features = extractFeatures(snapshot);

  if (features) {
    learningRegistry.recordEvent({
      type: "FEATURE_VECTOR",
      payload: features
    });
  }

  return snapshot;
}

module.exports = { refreshAll };

