// renderer/services/portfolioData.js
export async function getPortfolioSnapshot() {
  return await window.electron.invoke("portfolio:getLiveSnapshot");
}

