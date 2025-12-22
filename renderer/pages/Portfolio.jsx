import "../styles/portfolio.css";

export default function Portfolio() {
  return (
    <div className="portfolio-page">
      <h1>Portfolio</h1>

      <div className="portfolio-cards">
        <div className="card">
          <span className="label">Total Value</span>
          <span className="value">$90,451.34</span>
        </div>
        <div className="card">
          <span className="label">Equities</span>
          <span className="value">74.24%</span>
        </div>
        <div className="card">
          <span className="label">Digital Assets</span>
          <span className="value">25.76%</span>
        </div>
      </div>

      <div className="card table-card">
        <h2>Holdings</h2>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>ASML</td><td>10</td><td>$1,056.02</td><td>$10,560.20</td></tr>
            <tr><td>NVDA</td><td>73</td><td>$180.99</td><td>$13,212.27</td></tr>
            <tr><td>AVGO</td><td>80</td><td>$340.36</td><td>$27,228.80</td></tr>
            <tr><td>MSTR</td><td>25</td><td>$164.82</td><td>$4,120.50</td></tr>
            <tr><td>HOOD</td><td>35</td><td>$121.35</td><td>$4,247.25</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

