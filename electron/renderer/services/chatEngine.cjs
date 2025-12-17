// chatEngine.js

function processMessage(msg) {
  try {
    const lower = (msg || "").toLowerCase();

    if (lower.includes("hello") || lower.includes("hi")) {
      return "Hello! Jupiter is online and ready.";
    }

    if (lower.includes("market")) {
      return "Market scan: currently neutral with mixed signals.";
    }

    if (lower.includes("forecast")) {
      return "Forecast engine: projecting mild volatility.";
    }

    return "Jupiter received your message: " + msg;
  } catch (err) {
    return "Chat engine internal error.";
  }
}

module.exports = { processMessage };

