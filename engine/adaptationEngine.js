function adaptThresholds(patterns, current) {
  const next = { ...current };

  if ((patterns.growth_projection || 0) > 5) {
    next.growthSensitivity += 1;
  }

  return next;
}

module.exports = {
  adaptThresholds,
};

