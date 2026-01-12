// Heuristic resolver for common index aliases (V1)
// Non-tradable but analyzable

const INDEX_ALIASES = {
  SPX: "S&P 500",
  NDX: "NASDAQ 100",
  DJI: "Dow Jones Industrial Average",
  RUT: "Russell 2000",
  FTSE: "FTSE 100"
};

export async function indexAliasResolver(symbol) {
  if (!INDEX_ALIASES[symbol]) return null;

  return {
    valid: true,
    assetType: "index",
    canonicalSymbol: symbol,
    source: "index-alias"
  };
}
