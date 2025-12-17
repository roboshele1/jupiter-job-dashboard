const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- Mock Endpoints (replace with real data later) ---

app.get("/warm-start", (req, res) => {
  res.json({ message: "Warm Start Engine Response" });
});

app.get("/signals", (req, res) => {
  res.json({ message: "Signals Engine Response" });
});

app.get("/risk", (req, res) => {
  res.json({ message: "Risk Engine Response" });
});

app.get("/insights", (req, res) => {
  res.json({ message: "Insights Engine Response" });
});

app.get("/growth", (req, res) => {
  res.json({ message: "Growth Engine Response" });
});

app.get("/portfolio", (req, res) => {
  res.json({ message: "Portfolio Engine Response" });
});

// Start server
function startAPIServer() {
  const PORT = 4455;
  app.listen(PORT, () => {
    console.log(`🔌 Jupiter API Server running at http://localhost:${PORT}`);
  });
}

module.exports = { startAPIServer };

