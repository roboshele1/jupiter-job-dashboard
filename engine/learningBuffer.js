const buffer = [];

function recordOutcome(input, output) {
  buffer.push({
    input,
    output,
    timestamp: Date.now(),
  });
}

function readBuffer() {
  return [...buffer];
}

module.exports = {
  recordOutcome,
  readBuffer,
};

