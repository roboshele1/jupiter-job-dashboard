/**
 * JUPITER — Market Data Configuration
 * Activation Phase A — Step 1
 *
 * Authoritative configuration for live market data.
 * No UI imports. No execution. Config only.
 */

export const MARKET_DATA_CONFIG = Object.freeze({
  provider: "POLYGON",
  environment: "LIVE",
  baseUrl: "https://api.polygon.io",

  auth: {
    apiKeyEnvVar: "VITE_POLYGON_API_KEY",
  },

  constraints: {
    maxSymbolsPerRequest: 50,
    timeoutMs: 10000,
    retryAttempts: 2,
  },

  integrity: {
    requireSymbol: true,
    requirePrice: true,
    rejectZeroPrice: true,
  },

  metadata: {
    phase: "Activation Phase A",
    step: 1,
    mutable: false,
    description:
      "Live market data configuration. Provider-authoritative. Engine-consumed only.",
  },
});

