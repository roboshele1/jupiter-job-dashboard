// engine/alerts/discordBridge.js
// ALERT DELIVERY BRIDGE — Discord
// --------------------------------
// - Append-only delivery layer
// - Consumes escalation + intelligence output
// - Sends structured alert messages to Discord webhook
// - No mutation of engines, signals, or detection layers

import fs from "fs";
import path from "path";

const WEBHOOK_PATH = path.resolve(
  process.cwd(),
  "engine/runtime/discord_webhook.txt"
);

/**
 * Load Discord webhook URL from runtime file.
 * Avoids hardcoding secrets in repo.
 */
function loadWebhook() {
  try {
    if (!fs.existsSync(WEBHOOK_PATH)) return null;
    return fs.readFileSync(WEBHOOK_PATH, "utf8").trim();
  } catch {
    return null;
  }
}

/**
 * Format alert into Discord-friendly message.
 */
function formatDiscordMessage(intelligence) {
  const severity = intelligence?.severity ?? "INFO";
  const message = intelligence?.message ?? "No message";
  const ts = new Date(intelligence?.timestamp || Date.now()).toISOString();

  return {
    content:
      `🪐 **JUPITER ALERT**\n\n` +
      `Severity: **${severity}**\n` +
      `Time: ${ts}\n\n` +
      `${message}`
  };
}

/**
 * Push single alert to Discord.
 */
async function pushDiscordAlert(intelligence) {
  const webhook = loadWebhook();
  if (!webhook) return { status: "NO_WEBHOOK_CONFIGURED" };

  try {
    const payload = formatDiscordMessage(intelligence);

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return { status: "DISCORD_ALERT_SENT" };
  } catch (err) {
    return { status: "DISCORD_ALERT_FAILED", error: err.message };
  }
}

/**
 * Runner-facing batch bridge (append-only)
 * Accepts:
 *  - alerts[]
 *  - intelligence object
 */
export async function pushDiscordAlerts({ alerts = [], intelligence } = {}) {
  // Do nothing if nothing meaningful happened
  if (!alerts?.length && !intelligence) return { status: "NO_ALERTS" };

  // Prefer intelligence layer (human reasoning)
  if (intelligence && intelligence.severity !== "INFO") {
    return pushDiscordAlert(intelligence);
  }

  return { status: "NO_ESCALATION" };
}
