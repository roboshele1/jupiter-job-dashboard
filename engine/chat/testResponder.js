import { respondToQuestion } from './jupiterResponder.js';

const q = 'What growth signals do you see right now?';
const res = respondToQuestion(q);

console.log(JSON.stringify(res, null, 2));

