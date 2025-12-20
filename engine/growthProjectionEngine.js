function projectGrowth({ currentValue, targetValue, months }) {
  const rate = Math.pow(targetValue / currentValue, 1 / months) - 1;

  return {
    currentValue,
    targetValue,
    months,
    requiredMonthlyGrowthPct: +(rate * 100).toFixed(2),
  };
}

module.exports = {
  projectGrowth,
};

