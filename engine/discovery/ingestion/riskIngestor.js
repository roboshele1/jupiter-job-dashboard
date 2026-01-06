/**
 * Risk Ingestor — Balance Sheet & Solvency
 */

export function ingestRisk(raw) {
  return {
    debtToEquity: raw.debtToEquity ?? null,
    interestCoverage: raw.interestCoverage ?? null,
    netDebtToFcf: raw.netDebtToFcf ?? null,
  };
}
