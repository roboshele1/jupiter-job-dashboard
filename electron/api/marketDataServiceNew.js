import 'dotenv/config'; // automatically loads .env

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
  throw new Error("POLYGON_API_KEY not set. Please add it to your .env file.");
}

/**
 * Fetch the latest quote for a given stock symbol.
 * @param {string} symbol - Stock ticker symbol, e.g., "AAPL"
 * @returns {Promise<Object>} - JSON response with price data
 */
export async function fetchLastQuote(symbol) {
  const response = await fetch(
    `https://api.polygon.io/v1/last_quote/stocks/${symbol}?apiKey=${POLYGON_API_KEY}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Polygon API fetch failed: ${errorText}`);
  }

  return response.json();
}

