/**
 * Advanced Analytics Engine
 * Computes Sharpe ratio, Sortino, max drawdown, correlation matrix
 */

const RISK_FREE_RATE = 0.045; // 4.5% annual

/**
 * Calculate daily returns from price history
 */
function calculateReturns(priceHistory) {
  if (priceHistory.length < 2) return [];
  const returns = [];
  for (let i = 1; i < priceHistory.length; i++) {
    const ret = (priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1];
    returns.push(ret);
  }
  return returns;
}

/**
 * Calculate Sharpe Ratio
 * (return - risk_free_rate) / std_dev
 */
function calculateSharpeRatio(returns, annualize = true) {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);

  const excessReturn = annualize ? mean * 252 - RISK_FREE_RATE : mean - RISK_FREE_RATE / 252;
  const sharpe = stdDev === 0 ? 0 : excessReturn / (stdDev * Math.sqrt(annualize ? 252 : 1));

  return sharpe;
}

/**
 * Calculate Sortino Ratio
 * Like Sharpe but only penalizes downside volatility
 */
function calculateSortinoRatio(returns, annualize = true) {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const downside = returns.filter((r) => r < 0);

  if (downside.length === 0) return 0; // No downside = infinite sortino

  const downvariance =
    downside.reduce((sum, r) => sum + Math.pow(r - 0, 2), 0) / returns.length;
  const downsideDev = Math.sqrt(downvariance);

  const excessReturn = annualize ? mean * 252 - RISK_FREE_RATE : mean - RISK_FREE_RATE / 252;
  const sortino = downsideDev === 0 ? 0 : excessReturn / (downsideDev * Math.sqrt(annualize ? 252 : 1));

  return sortino;
}

/**
 * Calculate Maximum Drawdown
 */
function calculateMaxDrawdown(priceHistory) {
  if (priceHistory.length < 2) return 0;

  let maxPrice = priceHistory[0];
  let maxDrawdown = 0;

  for (let i = 1; i < priceHistory.length; i++) {
    if (priceHistory[i] > maxPrice) {
      maxPrice = priceHistory[i];
    }
    const drawdown = (maxPrice - priceHistory[i]) / maxPrice;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculate Calmar Ratio
 * Annual return / max drawdown
 */
function calculateCalmarRatio(priceHistory, returns) {
  const maxDrawdown = calculateMaxDrawdown(priceHistory);
  if (maxDrawdown === 0) return 0;

  const totalReturn = (priceHistory[priceHistory.length - 1] - priceHistory[0]) / priceHistory[0];
  const annualReturn = Math.pow(1 + totalReturn, 252 / priceHistory.length) - 1;

  return annualReturn / maxDrawdown;
}

/**
 * Calculate volatility (annualized)
 */
function calculateVolatility(returns) {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev * Math.sqrt(252); // Annualized
}

/**
 * Calculate correlation matrix for holdings
 */
function calculateCorrelationMatrix(holdingsReturns) {
  const symbols = Object.keys(holdingsReturns);
  const n = symbols.length;
  const correlation = {};

  for (let i = 0; i < n; i++) {
    correlation[symbols[i]] = {};
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlation[symbols[i]][symbols[j]] = 1.0;
      } else {
        const corr = calculatePearsonCorrelation(
          holdingsReturns[symbols[i]],
          holdingsReturns[symbols[j]]
        );
        correlation[symbols[i]][symbols[j]] = corr;
      }
    }
  }

  return correlation;
}

/**
 * Pearson correlation coefficient
 */
function calculatePearsonCorrelation(arr1, arr2) {
  if (arr1.length !== arr2.length || arr1.length < 2) return 0;

  const mean1 = arr1.reduce((a, b) => a + b) / arr1.length;
  const mean2 = arr2.reduce((a, b) => a + b) / arr2.length;

  let covariance = 0;
  let var1 = 0;
  let var2 = 0;

  for (let i = 0; i < arr1.length; i++) {
    const dev1 = arr1[i] - mean1;
    const dev2 = arr2[i] - mean2;
    covariance += dev1 * dev2;
    var1 += dev1 * dev1;
    var2 += dev2 * dev2;
  }

  const stdDev1 = Math.sqrt(var1 / arr1.length);
  const stdDev2 = Math.sqrt(var2 / arr2.length);

  if (stdDev1 === 0 || stdDev2 === 0) return 0;

  return (covariance / arr1.length) / (stdDev1 * stdDev2);
}

/**
 * Comprehensive portfolio analytics
 */
function analyzePortfolio(portfolioValue, holdings, priceHistories) {
  const returns = calculateReturns(portfolioValue);
  const holdingsReturns = {};

  Object.keys(priceHistories).forEach((symbol) => {
    holdingsReturns[symbol] = calculateReturns(priceHistories[symbol]);
  });

  return {
    sharpeRatio: calculateSharpeRatio(returns),
    sortinoRatio: calculateSortinoRatio(returns),
    volatility: calculateVolatility(returns),
    maxDrawdown: calculateMaxDrawdown(portfolioValue),
    calmarRatio: calculateCalmarRatio(portfolioValue, returns),
    totalReturn: (portfolioValue[portfolioValue.length - 1] - portfolioValue[0]) / portfolioValue[0],
    correlationMatrix: calculateCorrelationMatrix(holdingsReturns),
    holdingsVolatility: Object.keys(holdingsReturns).reduce((acc, sym) => {
      acc[sym] = calculateVolatility(holdingsReturns[sym]);
      return acc;
    }, {}),
  };
}

module.exports = {
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateCalmarRatio,
  calculateVolatility,
  calculateCorrelationMatrix,
  analyzePortfolio,
};
