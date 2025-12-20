// forecastEngine.js
// V1 stub — forecasting intentionally disabled

function getForecastSnapshot() {
  return {
    status: "disabled",
    reason: "Forecasting is not available in Jupiter V1",
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getForecastSnapshot
};

