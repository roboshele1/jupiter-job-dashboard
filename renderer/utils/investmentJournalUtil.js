// renderer/utils/investmentJournalUtil.js
// Utility to safely log investments to journal

export async function logInvestmentToJournal(symbol, amount, entryPrice, rank, ces, conviction) {
  try {
    await window.jupiter.invoke('investmentJournal:record', {
      symbol,
      amount,
      entryPrice,
      shares: entryPrice > 0 ? (amount / entryPrice) : 0,
      lcpeRank: rank ?? 999,
      lcpeCes: ces ?? 0,
      kellyConviction: conviction ?? 0,
      portfolioValueAtEntry: 0,
      notes: 'LCPE DCA - Monthly investment',
    });
  } catch (err) {
    console.warn('[Journal] Log failed:', err);
  }
}
