/**
 * FUNDAMENTALS NORMALIZATION LAYER (D16.4)
 * ---------------------------------------
 * Computes revenue growth using multi-period Polygon financials.
 *
 * RULES:
 * - Deterministic
 * - No inference / no guessing
 * - Uses only real historical data
 * - Missing fields remain null
 * - Engine-only, append-only
 */

function safeValue(node) {
  return typeof node?.value === "number" ? node.value : null;
}

/**
 * Compute revenue growth from historical fundamentals
 * Uses most recent period vs immediately prior period
 */
function computeRevenueGrowth(history = []) {
  if (!Array.isArray(history) || history.length < 2) {
    return null;
  }

  const latest = history[0]?.financials?.income_statement?.revenues;
  const prior = history[1]?.financials?.income_statement?.revenues;

  const latestRevenue = safeValue(latest);
  const priorRevenue = safeValue(prior);

  if (
    typeof latestRevenue !== "number" ||
    typeof priorRevenue !== "number" ||
    priorRevenue === 0
  ) {
    return null;
  }

  return (latestRevenue - priorRevenue) / priorRevenue;
}

function normalizeFundamentals({ ttm, history }) {
  if (!ttm?.financials) {
    return {
      revenueGrowth: null,
      grossMargin: null,
      freeCashFlow: null,
      debtToEquity: null,
      notes: ["Polygon fundamentals missing or malformed"],
    };
  }

  const income = ttm.financials.income_statement || {};
  const balance = ttm.financials.balance_sheet || {};
  const cashflow = ttm.financials.cash_flow_statement || {};

  const revenues = safeValue(income.revenues);
  const grossProfit = safeValue(income.gross_profit);

  const grossMargin =
    revenues && grossProfit ? grossProfit / revenues : null;

  const freeCashFlow =
    safeValue(cashflow.net_cash_flow_from_operating_activities);

  const longTermDebt = safeValue(balance.long_term_debt);
  const equity = safeValue(balance.equity);

  const debtToEquity =
    equity && longTermDebt ? longTermDebt / equity : null;

  const revenueGrowth = computeRevenueGrowth(history);

  return {
    revenueGrowth,
    grossMargin,
    freeCashFlow,
    debtToEquity,
    notes: revenueGrowth === null
      ? ["Revenue growth unavailable (insufficient history)"]
      : [],
  };
}

module.exports = Object.freeze({
  normalizeFundamentals,
});
