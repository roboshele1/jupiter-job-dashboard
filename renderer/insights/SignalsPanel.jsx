export default function SignalsPanel({ signals }) {
  if (!signals || !signals.available) {
    return null;
  }

  const { risk, performance } = signals;

  const pct = risk?.concentrationPct;
  const pctFormatted =
    typeof pct === "number" ? `${pct.toFixed(2)}%` : "—";

  const dailyPL = performance?.dailyPL;
  const dailyPLPct = performance?.dailyPLPct;

  const isPositive = typeof dailyPL === "number" && dailyPL >= 0;

  const badgeStyle = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    background: isPositive ? "#123d2a" : "#3d1212",
    color: isPositive ? "#3cffb0" : "#ff7a7a"
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ marginBottom: 12 }}>Signals</h3>

      <ul style={{ listStyle: "disc", paddingLeft: 20 }}>
        <li>
          Largest Holding:{" "}
          <strong>{risk?.largestHolding ?? "—"}</strong>
        </li>

        <li>
          Concentration: <strong>{pctFormatted}</strong>
        </li>

        <li style={{ marginTop: 8 }}>
          Daily P/L:{" "}
          <span style={badgeStyle}>
            {typeof dailyPL === "number"
              ? `${dailyPL.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} (${dailyPLPct.toFixed(2)}%)`
              : "—"}
          </span>
        </li>
      </ul>
    </div>
  );
}

