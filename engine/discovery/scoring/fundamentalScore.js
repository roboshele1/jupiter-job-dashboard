/**
 * FUNDAMENTAL SCORING ENGINE (D16)
 * --------------------------------
 * Converts real financials into normalized conviction signals.
 * No price prediction. Long-term durability focus.
 */

function scoreFundamentals(financials = {}) {
  if (!financials) {
    return {
      score: 0,
      factors: {},
      notes: ["No fundamentals available"],
    };
  }

  const income = financials.financials?.income_statement || {};
  const balance = financials.financials?.balance_sheet || {};
  const cashflow = financials.financials?.cash_flow_statement || {};

  const revenueGrowth = income.revenue_growth ?? 0;
  const freeCashFlow = cashflow.free_cash_flow ?? 0;
  const debtToEquity = balance.debt_to_equity ?? 1;
  const grossMargin = income.gross_margin ?? 0;

  const growth =
    revenueGrowth > 0.15 ? 2 :
    revenueGrowth > 0.05 ? 1 : 0;

  const quality =
    grossMargin > 0.5 ? 2 :
    grossMargin > 0.3 ? 1 : 0;

  const risk =
    debtToEquity > 2 ? 2 :
    debtToEquity > 1 ? 1 : 0;

  const cash =
    freeCashFlow > 0 ? 2 : 0;

  const score = growth + quality + cash - risk;

  return {
    score,
    factors: {
      growth,
      quality,
      risk,
      cash,
    },
  };
}

module.exports = Object.freeze({
  scoreFundamentals,
});
