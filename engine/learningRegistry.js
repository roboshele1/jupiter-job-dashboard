const registry = {
  patterns: [],
};

function registerPattern(pattern) {
  registry.patterns.push({
    timestamp: Date.now(),
    ...pattern,
  });
}

function getPatterns() {
  return registry.patterns;
}

module.exports = {
  registerPattern,
  getPatterns,
};

