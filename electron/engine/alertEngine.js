// ----- Jupiter Alert Engine (Day 35) ----- //
// Watches the multi-model forecast and triggers alerts on regime change

const { runForecast } = require("./forecastEngine");

let lastDirection = null;
let lastConfidence = null;

async function checkForAlerts() {
  try {
    const forecast = await runForecast();
    const { direction, confidence } = forecast;

    let alert = null;

    // 1. Regime Change Detection
    if (lastDirection && lastDirection !== direction) {
      alert = {
        type: "Regime Change",
        message: `Market regime changed: ${lastDirection} → ${direction}`,
        forecast,
      };
    }

    // 2. Confidence Spike Detection
    if (lastConfidence && Math.abs(confidence - lastConfidence) >= 15) {
      alert = {
        type: "Confidence Swing",
        message: `Confidence moved significantly (${lastConfidence} → ${confidence})`,
        forecast,
      };
    }

    // Update memory
    lastDirection = direction;
    lastConfidence = confidence;

    return alert;
  } catch (err) {
    console.error("Alert Engine Error:", err);
    return null;
  }
}

module.exports = { checkForAlerts };

