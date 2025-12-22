import "../styles/dashboard.css";

export default function Dashboard() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    totalValue: 90451.34,
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="card-grid">
        <div className="card wide">
          <span className="label">Snapshot Time</span>
          <span className="value muted">{snapshot.timestamp}</span>
        </div>

        <div className="card">
          <span className="label">Total Portfolio Value</span>
          <span className="value">${snapshot.totalValue.toLocaleString()}</span>
        </div>

        <div className="card">
          <span className="label">Daily P/L</span>
          <span className="value gain">$0.00 (0.00%)</span>
        </div>

        <div className="card wide">
          <span className="label">Allocation Bands</span>
          <div className="bands">
            <div className="band semiconductor" style={{ width: "52%" }}>Semiconductors 52%</div>
            <div className="band software" style={{ width: "28%" }}>Software 28%</div>
            <div className="band crypto" style={{ width: "12%" }}>Crypto 12%</div>
            <div className="band cash" style={{ width: "8%" }}>Cash 8%</div>
          </div>
        </div>

        <div className="card">
          <span className="label">System Status</span>
          <ul className="status">
            <li><strong>Market Data:</strong> LIVE</li>
            <li><strong>Refresh:</strong> 60s</li>
            <li><strong>Automation:</strong> ALERT-ONLY</li>
            <li><strong>Audit:</strong> IMMUTABLE</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

