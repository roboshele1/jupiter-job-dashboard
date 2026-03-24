const oldCode = `      // Calculate blended CAGR by live market value
      const blendedCAGR = enriched.reduce((s, h) => {
        const weight = h.marketValue / totalMarketValue;
        return s + (h.expectedCagr * weight);
      }, 0);`;

const newCode = `      // Calculate blended CAGR by live market value
      const blendedCAGR = totalMarketValue > 0 
        ? enriched.reduce((s, h) => {
            const weight = h.marketValue / totalMarketValue;
            return s + (h.expectedCagr * weight);
          }, 0)
        : 0;`;

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'portfolioValuesIpc.js');
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed blendedCAGR calculation');
