// marketData.js
// SAFE renderer-side market data loader (NO IPC REQUIRED)

export async function getMarketSnapshot() {
  try {
    const res = await fetch("http://localhost:5173/market-snapshot.json", {
      cache: "no-store",
    })

    if (!res.ok) throw new Error("Snapshot fetch failed")
    return await res.json()
  } catch (err) {
    console.error("Market snapshot error:", err)
    return null
  }
}

export function startMarketPolling(setData, setLastUpdate) {
  const load = async () => {
    const data = await getMarketSnapshot()
    if (data) {
      setData(data)
      setLastUpdate(new Date())
    }
  }

  load()
  return setInterval(load, 10_000)
}

