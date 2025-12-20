function extractPatterns(decisions) {
  const counts = {};

  decisions.forEach((d) => {
    counts[d.intent] = (counts[d.intent] || 0) + 1;
  });

  return counts;
}

module.exports = {
  extractPatterns,
};

