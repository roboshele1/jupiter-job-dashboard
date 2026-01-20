module.exports = {
  version: 'AHE_V1',

  mandate: {
    objective: 'Identify 1–3 asymmetric opportunities capable of doubling portfolio',
    mode: 'autonomous',
    cadence: 'seconds-minutes-hours',
    riskPosture: 'controlled-convexity'
  },

  requiredSignals: {
    capitalFlow: {
      description: 'Evidence of accumulation without price expansion',
      required: true,
      scoreRange: [0, 20]
    },
    volatilityState: {
      description: 'Volatility compression preceding expansion',
      required: true,
      scoreRange: [0, 20]
    },
    survivability: {
      description: 'Ability to survive long enough for asymmetry to resolve',
      required: true,
      scoreRange: [0, 20]
    },
    structuralCatalyst: {
      description: 'Non-consensus catalyst (regulatory, sectoral, capital re-rating)',
      required: false,
      scoreRange: [0, 15]
    },
    narrativeDissonance: {
      description: 'Price action contradicts prevailing narrative',
      required: false,
      scoreRange: [0, 15]
    },
    optionalMomentumIgnition: {
      description: 'Early momentum ignition (NOT late-stage trend)',
      required: false,
      scoreRange: [0, 10]
    }
  },

  scoring: {
    maxScore: 100,
    asymmetryThreshold: 75,
    eliteThreshold: 85
  },

  hardRules: [
    'Max 3 active candidates at any time',
    'No position sizing logic',
    'No trade execution logic',
    'No sentiment-based scoring',
    'No social media signals',
    'Survivability gate cannot be overridden'
  ]
};
