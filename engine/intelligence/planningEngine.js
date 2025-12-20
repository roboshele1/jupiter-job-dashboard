/**
 * Planning Engine (V2)
 * -------------------
 * Pure math. No forecasts. No opinions.
 */

export function requiredContribution({
  targetAmount,
  currentAmount,
  months,
  expectedReturn = 0.08,
}) {
  if (months <= 0) return null;

  const monthlyRate = expectedReturn / 12;
  const futureValueFactor =
    (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

  const needed =
    (targetAmount - currentAmount * Math.pow(1 + monthlyRate, months)) /
    futureValueFactor;

  return Math.max(0, Math.round(needed));
}

