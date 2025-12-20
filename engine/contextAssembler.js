function assembleContext({ portfolio, signals, risk }) {
  return {
    totalValue: portfolio.totalValue || 0,
    concentration: risk?.concentration || {},
    signalCount: signals?.length || 0,
  };
}

module.exports = {
  assembleContext,
};

