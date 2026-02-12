// engine/alerts/alertBackgroundRunner.js
// -------------------------------------------------------
// JUPITER ALERT BACKGROUND RUNNER — NORMALIZED SIGNAL PIPE
//
// Streams:
// 1) Opportunity (Discovery + Portfolio unified)
// 2) Portfolio reinforcement (Top 5 internal priority)
// 3) Drift ONLY if HIGH severity
//
// Delivery:
// terminal + macOS + Discord (identical weighted message)
// -------------------------------------------------------

const fetch = require("node-fetch");
const nodeNotifier = require("node-notifier");

const { runPortfolioOpportunityOrchestrator } = require("../opportunity/portfolioOpportunityOrchestrator.js");
const { runPortfolioReinforcementEngine } = require("../opportunity/portfolioReinforcementEngine.js");
const { runSnapshotDeltaDetection } = require("../detection/snapshotDeltaEngine.js");
const { classifyDetection } = require("../detection/classifierEngine.js");

// -----------------------------
// CONFIG
// -----------------------------
const RUNNER_INTERVAL_MS = 60 * 1000;
const HIGH_DRIFT_THRESHOLD = 0.02;

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1428900241112825936/QlUngSlUeaDroAy47zDGw9STCqe4gTZSaFVBLl-UtkbqsBYNpXDFu6JJ3TJjys1wVjBQ";

// -----------------------------
// DISCORD EMITTER
// -----------------------------
async function sendDiscordAlert(message) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  } catch (err) {
    console.log("[DISCORD ERROR]", err.message);
  }
}

// -----------------------------
// macOS NOTIFIER
// -----------------------------
function sendMacNotification(title, message) {
  nodeNotifier.notify({ title, message });
}

// -----------------------------
// NORMALIZED MESSAGE BUILDER
// -----------------------------
function buildOpportunityMessage(alert) {
  return (
    `JUPITER OPPORTUNITY\n\n` +
    `${alert.symbol} — ${alert.action}\n` +
    `Conviction: ${Number(alert.conviction).toFixed(2)}\n` +
    `Rank: ${alert.rank}\n` +
    `Regime: ${alert.regime}\n` +
    (alert.trajectory ? `Trajectory: ${alert.trajectory}\n` : "") +
    `Source: ${alert.source}`
  );
}

function buildPortfolioMessage(asset) {
  return (
    `PORTFOLIO REINFORCEMENT\n\n` +
    `${asset.symbol} — ${asset.signal}\n` +
    `Score: ${Number(asset.reinforcementScore).toFixed(3)}\n` +
    `Conviction: ${Number(asset.conviction || 0).toFixed(2)}\n` +
    `Regime: ${asset.regime || "UNKNOWN"}\n` +
    (asset.trajectory ? `Trajectory: ${asset.trajectory}` : "")
  );
}

function buildDriftMessage(d) {
  return (
    `JUPITER DRIFT (HIGH)\n\n` +
    `${d.symbol} allocation shift\n` +
    `Magnitude: ${Number(d.magnitude).toFixed(3)}`
  );
}

// -----------------------------
// TERMINAL PRINT
// -----------------------------
function emitTerminal(message) {
  console.log("\n" + message);
}

// -----------------------------
// DRIFT FILTER
// -----------------------------
function extractHighSeverityDriftAlerts() {
  const detection = runSnapshotDeltaDetection();
  const classification = classifyDetection(detection);
  const driftSignals = classification?.driftSignals || [];

  return driftSignals.filter(d => Math.abs(d.magnitude) >= HIGH_DRIFT_THRESHOLD);
}

// -----------------------------
// MAIN LOOP
// -----------------------------
async function runAlertCycle() {

  // -----------------------------
  // OPPORTUNITY STREAM
  // -----------------------------
  const opportunitySignals = await runPortfolioOpportunityOrchestrator();

  for (const alert of opportunitySignals) {
    const message = buildOpportunityMessage(alert);

    emitTerminal(message);
    await sendDiscordAlert(message);
    sendMacNotification("JUPITER OPPORTUNITY", message);
  }

  // -----------------------------
  // PORTFOLIO REINFORCEMENT STREAM
  // -----------------------------
  const reinforcement = await runPortfolioReinforcementEngine();

  for (const asset of reinforcement) {
    const message = buildPortfolioMessage(asset);

    emitTerminal(message);
    await sendDiscordAlert(message);
    sendMacNotification("PORTFOLIO REINFORCEMENT", message);
  }

  // -----------------------------
  // DRIFT ONLY IF HIGH
  // -----------------------------
  const highDrift = extractHighSeverityDriftAlerts();

  for (const d of highDrift) {
    const message = buildDriftMessage(d);

    emitTerminal(message);
    await sendDiscordAlert(message);
    sendMacNotification("JUPITER DRIFT", message);
  }
}

// -----------------------------
// START RUNNER
// -----------------------------
function startAlertBackgroundRunner() {
  console.log("[JUPITER ALERT RUNNER] Opportunity + Portfolio reinforcement live (60s cadence)");
  runAlertCycle();
  setInterval(runAlertCycle, RUNNER_INTERVAL_MS);
}

module.exports = Object.freeze({
  startAlertBackgroundRunner
});
