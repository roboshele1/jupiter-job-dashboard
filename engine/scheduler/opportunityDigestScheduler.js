/**
 * JUPITER — 30 MIN OPPORTUNITY DIGEST SCHEDULER (WITH PERSISTENCE)
 *
 * Independent from 60s runner.
 *
 * Every 30 minutes:
 *  - runs opportunity scan
 *  - ranks top candidates
 *  - builds digest
 *  - pushes to terminal + Discord + macOS
 *  - tracks persistence across cycles
 *  - escalates CAPITAL ALLOCATION PRIORITY
 */

const fetch = require("node-fetch");
const nodeNotifier = require("node-notifier");

const { runPortfolioOpportunityOrchestrator } =
  require("../opportunity/portfolioOpportunityOrchestrator.js");

const { updatePersistence } =
  require("./opportunityPersistenceEngine.js");

// 30 minutes
const DIGEST_INTERVAL_MS = 30 * 60 * 1000;

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1428900241112825936/QlUngSlUeaDroAy47zDGw9STCqe4gTZSaFVBLl-UtkbqsBYNpXDFu6JJ3TJjys1wVjBQ";

// -----------------------------
// DISCORD PUSH
// -----------------------------
async function sendDiscordDigest(message) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  } catch (err) {
    console.log("[DISCORD DIGEST ERROR]", err.message);
  }
}

// -----------------------------
// macOS PUSH
// -----------------------------
function sendMacDigest(title, message) {
  nodeNotifier.notify({ title, message });
}

// -----------------------------
// FORMAT DIGEST
// -----------------------------
function buildDigest(opportunities) {
  let msg = "JUPITER — 30MIN OPPORTUNITY DIGEST\n\n";

  opportunities.forEach((o, i) => {
    msg +=
      `${i + 1}. ${o.symbol}\n` +
      `Action: ${o.action}\n` +
      `Conviction: ${o.conviction}\n` +
      `Rank: ${o.rank}\n` +
      `Regime: ${o.regime}\n\n`;
  });

  return msg;
}

// -----------------------------
// MAIN DIGEST LOOP
// -----------------------------
async function runOpportunityDigestCycle() {

  console.log("\n[JUPITER DIGEST] Running 30min opportunity scan...");

  const opportunities = await runPortfolioOpportunityOrchestrator();

  if (!opportunities || !opportunities.length) {
    console.log("[JUPITER DIGEST] No opportunities this cycle.");
    return;
  }

  // Top 5 ranked
  const top5 = opportunities.slice(0, 5);

  // Build digest
  const digestMessage = buildDigest(top5);

  console.log("\n[JUPITER DIGEST]");
  console.log(digestMessage);

  await sendDiscordDigest(digestMessage);
  sendMacDigest("JUPITER OPPORTUNITY DIGEST", digestMessage);

  // -----------------------------
  // PERSISTENCE ENGINE
  // -----------------------------
  const escalations = updatePersistence(top5);

  if (escalations.length) {

    console.log("\n[JUPITER CAPITAL PRIORITY]");

    escalations.forEach(e => {

      const msg =
        `CAPITAL ALLOCATION PRIORITY\n\n` +
        `${e.symbol}\n` +
        `Repeated top ranking across cycles\n` +
        `Confidence Hits: ${e.hits}`;

      console.log(msg);

      sendDiscordDigest(msg);
      sendMacDigest("JUPITER CAPITAL PRIORITY", msg);
    });
  }
}

// -----------------------------
// START SCHEDULER
// -----------------------------
function startOpportunityDigestScheduler() {
  console.log("[JUPITER DIGEST] 30min scheduler live.");
  runOpportunityDigestCycle();
  setInterval(runOpportunityDigestCycle, DIGEST_INTERVAL_MS);
}

module.exports = Object.freeze({
  startOpportunityDigestScheduler
});
