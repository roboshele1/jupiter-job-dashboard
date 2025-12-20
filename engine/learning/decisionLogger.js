import { registerEvent } from './learningRegistry.js';

export function logDecision(context) {
  registerEvent('DECISION', {
    context
  });
}

