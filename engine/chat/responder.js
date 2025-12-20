// engine/chat/responder.js
import { queryLearning } from '../learning/queryEngine.js';

export async function respond(question) {
  const result = queryLearning(question);

  return {
    answer: result.answer,
    meta: {
      source: 'learning-engine',
      ts: Date.now()
    }
  };
}

