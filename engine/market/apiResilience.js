const RATE_LIMITS = { polygon: 6, coinbase: 10, yahoo: 5 };
const lastCall = {};
async function withRateLimit(provider, fn) {
  const now = Date.now();
  const last = lastCall[provider] || 0;
  const minGap = (1000 / RATE_LIMITS[provider]) * 1000;
  if (now - last < minGap) await new Promise(r => setTimeout(r, minGap - (now - last)));
  lastCall[provider] = Date.now();
  return fn();
}
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } 
    catch (e) { if (i === maxRetries - 1) throw e; await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000)); }
  }
}
const FALLBACK_CHAIN = { equity: ['polygon', 'yahoo'], crypto: ['coinbase', 'polygon'] };
export { withRateLimit, withRetry, FALLBACK_CHAIN };
