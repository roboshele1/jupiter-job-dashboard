// ================================
// CENTRALIZED PRECISION UTILITIES
// Phase 1.5.3
// ================================

// ---------- BASIC FORMATTERS ----------

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `$${Number(value).toFixed(2)}`;
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Number(value).toFixed(2)}%`;
}

// ---------- PRICE FORMATTERS ----------

export function formatEquityPrice(value) {
  if (value === null || Number.isNaN(value)) return "--";
  return `$${Number(value).toFixed(2)}`;
}

export function formatCryptoPrice(value) {
  if (value === null || Number.isNaN(value)) return "--";
  return `$${Number(value).toFixed(6)}`;
}

// ---------- QUANTITY ----------

export function formatQuantity(value, decimals = 2) {
  if (value === null || Number.isNaN(value)) return "--";
  return Number(value).toFixed(decimals);
}

// ---------- P/L ----------

export function formatSignedUSD(value) {
  if (value === null || Number.isNaN(value)) return "--";

  const abs = Math.abs(value).toFixed(2);
  if (value > 0) return `+$${abs}`;
  if (value < 0) return `-$${abs}`;
  return `$${abs}`;
}

export function plColor(value) {
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "grey";
}

