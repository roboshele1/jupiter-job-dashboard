const cryptoPrices = require("./priceProviders/crypto");
const equityPrices = require("./priceProviders/equities");

function resolvePrices(positions) {
  return positions.map(pos => {
    let price = 0;

    if (pos.assetType === "crypto") {
      price = cryptoPrices[pos.assetId] ?? 0;
    }

    if (pos.assetType === "equity") {
      price = equityPrices[pos.assetId] ?? 0;
    }

    const marketValue =
      typeof pos.quantity === "number" && typeof price === "number"
        ? pos.quantity * price
        : 0;

    return {
      ...pos,
      price,
      marketValue,
    };
  });
}

module.exports = {
  resolvePrices,
};

