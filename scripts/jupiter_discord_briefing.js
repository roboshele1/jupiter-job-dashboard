const https = require('https');
const fs    = require('fs');
const path  = require('path');

const WEBHOOK      = 'https://discord.com/api/webhooks/1428900241112825936/QlUngSlUeaDroAy47zDGw9STCqe4gTZSaFVBLl-UtkbqsBYNpXDFu6JJ3TJjys1wVjBQ';
const GOAL         = 1000000;
const GOAL_YEAR    = 2037;
const BLENDED_CAGR = 0.269;
const MONTHLY_RATE = Math.pow(1 + BLENDED_CAGR, 1/12) - 1;
const POLYGON_KEY  = 'YnaWTNmcXAkNMDpZTrFqpeLbvxisYOc3';

function getHoldings() {
  try {
    const dir   = path.join(__dirname, '..', 'engine', 'snapshots');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse();
    const data  = JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf8'));
    return Array.isArray(data.holdings) ? data.holdings : Object.values(data.holdings);
  } catch(e) { return []; }
}

function fetchPrice(symbol) {
  return new Promise(resolve => {
    const cryptos = ['BTC','ETH','MSTR'];
    if (cryptos.includes(symbol)) {
      const url = `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`;
      https.get(url, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve(parseFloat(JSON.parse(d).data.amount)); }
          catch(e) { resolve(0); }
        });
      }).on('error', () => resolve(0));
    } else {
      const ticker = symbol === 'CNSWF' ? 'CNSWF' : symbol;
      const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${POLYGON_KEY}`;
      https.get(url, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { const r = JSON.parse(d).results; resolve((r && r[0]) ? r[0].c : 0); }
          catch(e) { resolve(0); }
        });
      }).on('error', () => resolve(0));
    }
  });
}

async function getLivePortfolioValue() {
  const holdings = getHoldings();
  if (!holdings.length) return 87000;
  let total = 0;
  for (const h of holdings) {
    const price = await fetchPrice(h.symbol);
    total += price * (h.quantity || 0);
  }
  return total > 0 ? total : 87000;
}

function getMonthlyTarget() {
  const start  = new Date(2026, 1, 1);
  const now    = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return 87000 * Math.pow(1 + MONTHLY_RATE, months);
}

function getStats(value) {
  const now       = new Date();
  const yearsLeft = GOAL_YEAR - now.getFullYear() + (12 - now.getMonth()) / 12;
  const progress  = (value / GOAL) * 100;
  const reqCAGR   = (Math.pow(GOAL / value, 1 / Math.max(yearsLeft, 0.1)) - 1) * 100;
  const proj2037  = value * Math.pow(1 + BLENDED_CAGR, yearsLeft);
  let months = 0, v = value;
  while (v < GOAL && months < 300) { v *= (1 + MONTHLY_RATE); months++; }
  const hitDate = new Date();
  hitDate.setMonth(hitDate.getMonth() + months);
  return { yearsLeft, progress, reqCAGR, proj2037, hitDate, months };
}

function sendToDiscord(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u    = new URL(WEBHOOK);
    const req  = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { res.on('data', () => {}); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Fetching live portfolio value...');
  const value  = await getLivePortfolioValue();
  const target = getMonthlyTarget();
  const delta  = value - target;
  const stats  = getStats(value);
  const now    = new Date();
  const status = delta > 5000 ? 'CRUSHING IT' : delta > 0 ? 'ON TRACK' : 'BEHIND TARGET';
  const hitMonth = stats.hitDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  console.log('Portfolio value:', '$' + value.toLocaleString('en-US', {maximumFractionDigits:0}));

  const payload = {
    username: 'Jupiter',
    embeds: [{
      title: 'Jupiter Morning Briefing',
      description: now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }),
      color: delta >= 0 ? 0x22c55e : 0xef4444,
      fields: [
        { name: 'Portfolio Value',   value: '$' + value.toLocaleString('en-US', {maximumFractionDigits:0}),  inline: true },
        { name: 'Monthly Target',    value: '$' + target.toLocaleString('en-US', {maximumFractionDigits:0}), inline: true },
        { name: 'vs Target',         value: (delta >= 0 ? '+' : '') + '$' + Math.abs(delta).toLocaleString('en-US', {maximumFractionDigits:0}) + ' — ' + status, inline: true },
        { name: 'Goal Progress',     value: stats.progress.toFixed(1) + '% of $1M', inline: true },
        { name: 'Blended CAGR',      value: (BLENDED_CAGR*100).toFixed(1) + '% (need ' + stats.reqCAGR.toFixed(1) + '%)', inline: true },
        { name: 'Years to 2037',     value: stats.yearsLeft.toFixed(1) + ' years', inline: true },
        { name: 'LCPE This Month',   value: 'Deploy $500 into CNSWF', inline: false },
        { name: 'Projected $1M',     value: hitMonth + ' (' + stats.months + ' months away)', inline: true },
        { name: 'Projected by 2037', value: '$' + stats.proj2037.toLocaleString('en-US', {maximumFractionDigits:0}), inline: true },
      ],
      footer: { text: 'Jupiter Investment Engine' },
      timestamp: now.toISOString(),
    }]
  };

  const code = await sendToDiscord(payload);
  console.log('Sent — status:', code);
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
