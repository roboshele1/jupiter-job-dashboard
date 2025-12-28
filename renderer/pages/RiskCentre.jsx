export default function RiskCentre() {
  const snapshot = {
    asOf: Date.now(),
    totals: {
      equityPct: 0.667,
      cryptoPct: 0.333,
    },
    concentration: {
      top1Pct: 66.7,
    },
    contributors: [
      { symbol: "NVDA", pct: 0.667 },
      { symbol: "BTC", pct: 0.333 },
    ],
  };

  // Policy thresholds (explicit, deterministic)
  const thresholds = {
    maxTop1Pct: 50,
    maxCryptoPct: 30,
  };

  // Threshold breaches
  const breaches = [
    snapshot.concentration.top1Pct > thresholds.maxTop1Pct && {
      key: "CONCENTRATION",
      label: "Single-position concentration",
      severity: "HIGH",
    },
    snapshot.totals.cryptoPct * 100 > thresholds.maxCryptoPct && {
      key: "CRYPTO",
      label: "Crypto exposure",
      severity: "ELEVATED",
    },
  ].filter(Boolean);

  // Risk Regime Classification (deterministic ruleset)
  let regime = {
    name: "Balanced",
    description: "No dominant structural risk regime detected.",
  };

  if (
    breaches.find((b) => b.key === "CONCENTRATION") &&
    breaches.find((b) => b.key === "CRYPTO")
  ) {
    regime = {
      name: "Concentration + Volatility Driven",
      description:
        "Risk dominated by a single large position combined with elevated crypto exposure.",
    };
  } else if (breaches.find((b) => b.key === "CONCENTRATION")) {
    regime = {
      name: "Concentration Driven",
      description:
        "Risk dominated by a single large position relative to portfolio size.",
    };
  } else if (breaches.find((b) => b.key === "CRYPTO")) {
    regime = {
      name: "Volatility Driven",
      description:
        "Risk dominated by elevated exposure to high-volatility assets.",
    };
  }

  return (
    <div className="page">
      <h1>Risk Centre</h1>

      <p style={{ opacity: 0.6 }}>
        Mode: Read-only · Deterministic · Intelligence-only
      </p>

      <p style={{ opacity: 0.6 }}>
        Snapshot as of {new Date(snapshot.asOf).toLocaleString()}
      </p>

      <hr />

      <section>
        <h3>Exposure</h3>
        <p>Equity: {(snapshot.totals.equityPct * 100).toFixed(1)}%</p>
        <p>Crypto: {(snapshot.totals.cryptoPct * 100).toFixed(1)}%</p>
      </section>

      <section>
        <h3>Concentration</h3>
        <p>Top 1: {snapshot.concentration.top1Pct}%</p>
      </section>

      <section>
        <h3>Top Risk Contributors</h3>
        <ul>
          {snapshot.contributors.map((c) => (
            <li key={c.symbol}>
              {c.symbol} — {(c.pct * 100).toFixed(1)}%
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Forward Stress Scenarios</h3>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td>Equity −20%</td>
              <td align="right">−13.3%</td>
            </tr>
            <tr>
              <td>Crypto −30%</td>
              <td align="right">−10.0%</td>
            </tr>
            <tr>
              <td>Equity −20% + Crypto −30%</td>
              <td align="right">−23.3%</td>
            </tr>
            <tr>
              <td>Macro Shock (−15%)</td>
              <td align="right">−15.0%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>Risk Threshold Breaches</h3>
        {breaches.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No policy breaches detected.</p>
        ) : (
          <ul>
            {breaches.map((b, i) => (
              <li key={i}>
                {b.label} — {b.severity}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Risk Regime</h3>
        <p>
          <strong>{regime.name}</strong>
        </p>
        <p style={{ opacity: 0.75 }}>{regime.description}</p>
        <p style={{ opacity: 0.6 }}>
          Regime classification describes structure — not actions.
        </p>
      </section>
    </div>
  );
}

