/**
 * Growth Query Engine
 * -------------------
 * Answers: "How much X → Y in Z time?"
 */

export function requiredContribution({
  target,
  months,
  annualReturn,
}) {
  const r = annualReturn / 12;
  return Math.round(
    target / ((Math.pow(1 + r, months) - 1) / r)
  );
}

