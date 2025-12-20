// engine/decision/paths/portfolioPath.js
import { projectAsset } from './assetPath.js';

export function projectPortfolio({ assets, months }) {
  const projections = assets.map(a =>
    projectAsset({ ...a, months })
  );

  const totalFutureValue = projections.reduce(
    (sum, a) => sum + a.projectedValue,
    0
  );

  return {
    months,
    assets: projections,
    totalFutureValue: Number(totalFutureValue.toFixed(2))
  };
}

