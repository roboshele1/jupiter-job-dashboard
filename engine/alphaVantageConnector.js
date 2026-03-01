/**
 * Alpha Vantage Connector
 * Fetches fundamental data for stock screening
 */

const API_KEY = process.env.VITE_ALPHA_VANTAGE_KEY || 'QXRLQ6LTQI4IH4VG';
const BASE_URL = 'https://www.alphavantage.co/query';

// Rate limiting: Alpha Vantage = 5 calls/min free tier
const requestQueue = [];
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 12000) { // 12 seconds between requests
    await new Promise(r => setTimeout(r, 12000 - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export async function getOverviewData(symbol) {
  try {
    await rateLimit();
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.Note) {
      console.warn('Alpha Vantage rate limit hit');
      return null;
    }
    
    return {
      symbol: data.Symbol,
      name: data.Name,
      sector: data.Sector,
      marketCap: parseInt(data.MarketCap) || 0,
      peRatio: parseFloat(data.PERatio) || 0,
      revenuePerShare: parseFloat(data.RevenuePerShareTTM) || 0,
      profitMargin: parseFloat(data.ProfitMargin) || 0,
      grossMargin: parseFloat(data.GrossMargin) || 0,
      operatingMargin: parseFloat(data.OperatingMarginTTM) || 0,
      roe: parseFloat(data.ReturnOnEquityTTM) || 0,
      description: data.Description
    };
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err);
    return null;
  }
}

export async function getIncomeStatement(symbol) {
  try {
    await rateLimit();
    const url = `${BASE_URL}?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.annualReports) return null;
    
    // Get last 4 years
    return data.annualReports.slice(0, 4).map(report => ({
      fiscalDateEnding: report.fiscalDateEnding,
      totalRevenue: parseInt(report.totalRevenue) || 0,
      grossProfit: parseInt(report.grossProfit) || 0,
      operatingIncome: parseInt(report.operatingIncome) || 0,
      netIncome: parseInt(report.netIncome) || 0,
      grossMargin: parseInt(report.grossProfit) / parseInt(report.totalRevenue) || 0
    }));
  } catch (err) {
    console.error(`Error fetching income statement for ${symbol}:`, err);
    return null;
  }
}

export async function getQuoteData(symbol) {
  try {
    await rateLimit();
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data['Global Quote']) return null;
    
    const quote = data['Global Quote'];
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      changePercent: parseFloat(quote['10. change percent']) / 100,
      timestamp: quote['07. latest trading day']
    };
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return null;
  }
}
