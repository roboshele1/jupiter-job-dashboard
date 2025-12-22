export async function getMarketSnapshot() {
  if (!window.marketAPI?.getSnapshot) {
    throw new Error("marketAPI not available");
  }
  return await window.marketAPI.getSnapshot();
}

