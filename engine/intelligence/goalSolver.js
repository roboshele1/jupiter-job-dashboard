/**
 * Goal Solver
 * -----------
 * Pure math. No prediction.
 */

export function requiredMonthlyInvestment(
  targetAmount,
  months,
  expectedAnnualReturn = 0.08
) {
  const r = expectedAnnualReturn / 12;
  return (
    targetAmount * r /
    (Math.pow(1 + r, months) - 1)
  );
}

