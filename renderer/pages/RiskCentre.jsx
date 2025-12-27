import { useEffect, useState } from "react";

export default function RiskCentre() {
  const [risk, setRisk] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!window?.jupiter?.getRiskSnapshot) {
          throw new Error("Risk API not available");
        }
        const data = await window.jupiter.getRiskSnapshot();
        if (mounted) setRisk(data);
      } catch (err) {
        console.error("[RISK_CENTRE_RENDER_ERROR]", err);
        if (mounted) setError(err.message);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!risk) return <div>Loading risk snapshot…</div>;

  const { totalValue, exposure, flags, bands, contributors } = risk;

  return (
    <div style={{ padding: 24 }}>
      <h1>Risk Centre</h1>

      <div style={{ marginTop: 12 }}>
        <strong>Total Portfolio Value:</strong>{" "}
        ${totalValue.toFixed(2)}
      </div>

      <h3 style={{ marginTop: 24 }}>Exposure</h3>
      <div>Equity: {exposure.equityPct.toFixed(2)}%</div>
      <div>Crypto: {exposure.cryptoPct.toFixed(2)}%</div>

      <h3 style={{ marginTop: 24 }}>Risk Bands</h3>
      <div>Crypto Exposure Band: <strong>{bands.cryptoExposure}</strong></div>
      <div>Concentration Band: <strong>{bands.concentration}</strong></div>

      <h3 style={{ marginTop: 24 }}>Flags</h3>
      <div>High Crypto Exposure: {String(flags.highCryptoExposure)}</div>
      <div>High Concentration: {String(flags.highConcentration)}</div>

      <h3 style={{ marginTop: 24 }}>Top 3 Risk Contributors</h3>
      <table
        border="1"
        cellPadding="8"
        style={{ marginTop: 12, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Asset Class</th>
            <th>Live Value</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {contributors.top3.map((p) => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.assetClass}</td>
              <td>${p.liveValue.toFixed(2)}</td>
              <td>{(p.weight * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

