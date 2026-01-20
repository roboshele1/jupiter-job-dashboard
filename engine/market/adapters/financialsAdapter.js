/**
 * Financials Adapter
 * Purpose: Normalize survivability-critical fundamentals
 * Sources: Polygon (where available), conservative inference otherwise
 */

module.exports = async function financialsAdapter(asset = {}) {
  const out = {
    cashRunwayMonths: null,
    dilutionRisk: null,
    binaryEventRisk: false,
    sourceConfidence: 'LOW',
    notes: []
  };

  // 1) Explicit cash runway (best case)
  if (asset.financials?.cashRunwayMonths) {
    out.cashRunwayMonths = asset.financials.cashRunwayMonths;
    out.sourceConfidence = 'HIGH';
    return out;
  }

  // 2) Infer runway from cash + burn (if present)
  if (
    asset.financials?.cash &&
    asset.financials?.quarterlyBurn
  ) {
    out.cashRunwayMonths =
      Math.floor((asset.financials.cash / asset.financials.quarterlyBurn) * 3);

    out.sourceConfidence = 'MEDIUM';
    out.notes.push('Cash runway inferred from cash/burn');
    return out;
  }

  // 3) Fallback: mark as unknown (LATENT-eligible)
  out.notes.push('Cash runway unavailable — requires filing or fundamentals source');
  return out;
};
