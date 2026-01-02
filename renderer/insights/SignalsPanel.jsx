export default function SignalsPanel({ signals }) {
  if (!signals?.available) return null;

  const { risk, performance } = signals;

  return (
    <section>
      <h3>Signals</h3>
      <ul>
        <li>Largest Holding: {risk.largestHolding}</li>
        <li>Concentration: {risk.concentrationPct.toFixed(2)}%</li>
        <li style={{ color: performance.dailyPL >= 0 ? "green" : "red" }}>
          Daily P/L: ${performance.dailyPL.toLocaleString()}
        </li>
      </ul>
    </section>
  );
}

