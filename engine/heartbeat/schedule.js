import { runMarketPulseJob } from "./marketPulseJob.js";

const ATLANTIC_PULSES = [
  { hour: 11, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 16, minute: 30 }
];

function isAtlanticTradingDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Mon–Fri only
}

function shouldTriggerPulse(now) {
  return ATLANTIC_PULSES.some(p => {
    return now.getHours() === p.hour && now.getMinutes() === p.minute;
  });
}

export function startHeartbeatScheduler() {
  console.log("[HEARTBEAT] Scheduler armed (Atlantic Time)");

  setInterval(async () => {
    const now = new Date();

    if (!isAtlanticTradingDay(now)) return;

    if (shouldTriggerPulse(now)) {
      await runMarketPulseJob();
    }

  }, 60 * 1000); // check every minute
}
