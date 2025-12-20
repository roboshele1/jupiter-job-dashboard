import { readLearningState } from './readLearningState.js';

export function queryLearning(question) {
  const state = readLearningState();

  return {
    question,
    summary: {
      totalEvents: state.totalEvents,
      decisions: state.decisions.length,
      growthSignals: state.growthSignals.length
    },
    lastSignal: state.growthSignals.at(-1) || null
  };
}

