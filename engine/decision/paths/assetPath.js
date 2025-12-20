// engine/decision/paths/assetPath.js
export function projectAsset({
  symbol,
  capital,
  annualCAGR,
  months
}) {
  const years = months / 12;
  const futureValue = capital * Math.pow(1 + annualCAGR / 100, years);

  return {
    symbol,
    capital,
    annualCAGR,
    months,
    projectedValue: Number(futureValue.toFixed(2))
  };
}

