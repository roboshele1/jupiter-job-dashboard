/**
 * Financial Ingestor — Read Only
 * TTM + YoY normalized metrics
 */

export function ingestFinancials(raw) {
  return {
    revenueGrowthYoY: raw.revenueGrowthYoY ?? null,
    revenueGrowthTTM: raw.revenueGrowthTTM ?? null,
    epsGrowthYoY: raw.epsGrowthYoY ?? null,
    epsGrowthTTM: raw.epsGrowthTTM ?? null,

    grossMargin: raw.grossMargin ?? null,
    operatingMargin: raw.operatingMargin ?? null,
    fcfMargin: raw.fcfMargin ?? null,
  };
}
