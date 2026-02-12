// engine/alerts/discordBridge.js
// Jupiter — Discord Alert Bridge

import { WebhookClient } from 'discord.js';

// Replace with your actual webhook URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1428900241112825936/QlUngSlUeaDroAy47zDGw9STCqe4gTZSaFVBLl-UtkbqsBYNpXDFu6JJ3TJjys1wVjBQ';
const hook = new WebhookClient({ url: WEBHOOK_URL });

/**
 * Push alerts to Discord.
 * Accepts either a single alert object or an array of alerts.
 */
export async function pushDiscordAlerts(alerts) {
  if (!alerts) return;

  // Ensure alerts is always an array
  const alertArray = Array.isArray(alerts) ? alerts : [alerts];

  for (const alert of alertArray) {
    await hook.send({
      content: `[${alert.severity}] ${alert.symbol || ''} — ${alert.message}`
    });
  }
}
