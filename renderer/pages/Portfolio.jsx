import { useEffect, useState } from "react";

export default function Portfolio() {
  const [crypto, setCrypto] = useState({});

  useEffect(() => {
    (async () => {
      const c = await window.prices.getCryptoPrices();
      setCrypto(c);
    })();
  }, []);

  return (
    <div>
      <h1>Portfolio</h1>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Live $</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(crypto).map(([s, p]) => (
            <tr key={s}>
              <td>{s}</td>
              <td>${p.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

