// engine/decision/cagrMath.js
export function futureValue({ principal, annualCAGR, months }) {
  const years = months / 12;
  return principal * Math.pow(1 + annualCAGR / 100, years);
}

export function requiredPrincipal({ targetValue, annualCAGR, months }) {
  const years = months / 12;
  return targetValue / Math.pow(1 + annualCAGR / 100, years);
}

