import { queryLearning } from './api/index.js';

const result = queryLearning(
  'What signals have been detected so far?'
);

console.log(JSON.stringify(result, null, 2));

