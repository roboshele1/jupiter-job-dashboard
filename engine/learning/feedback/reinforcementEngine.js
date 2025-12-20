// engine/learning/feedback/reinforcementEngine.js

const feedbackLog = [];

/**
 * Record a reinforcement feedback event
 * @param {Object} event
 */
export function recordFeedback(event) {
  feedbackLog.push({
    ...event,
    ts: Date.now()
  });
  return true;
}

/**
 * Retrieve all recorded feedback events
 */
export function getFeedbackLog() {
  return feedbackLog;
}

