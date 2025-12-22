import http from "http";

// ----------------------------
// SNAPSHOT LOGIC (PURE FUNCTION)
// ----------------------------
export async function getMarketSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    crypto: {
      BTC: { price: 88501.56, source: "coinbase" },
      ETH: { price: 3010.95, source: "coinbase" }
    },
    equities: {
      ASML: { price: 1056.02, source: "polygon" },
      NVDA: { price: 180.99, source: "polygon" },
      AVGO: { price: 340.36, source: "polygon" },
      MSTR: { price: 164.82, source: "polygon" },
      HOOD: { price: 121.35, source: "polygon" },
      BMNR: { price: 31.36, source: "polygon" },
      APLD: { price: 27.85, source: "polygon" }
    }
  };
}

// ----------------------------
// HTTP SERVER (ONLY IF RUN DIRECTLY)
// ----------------------------
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const server = http.createServer(async (_req, res) => {
    const snapshot = await getMarketSnapshot();
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify(snapshot));
  });

  server.listen(3001, () => {
    console.log("📡 Market Snapshot Server running on http://localhost:3001");
  });
}

