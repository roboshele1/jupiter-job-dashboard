/**
 * renderer/api/marketData.js
 * IPC-safe price access via preload bridge
 */

export async function getLivePrices() {
  if (!window.price || typeof window.price.getLive !== 'function') {
    return {};
  }

  try {
    const res = await window.price.getLive();
    if (!res || res.ok !== true) return {};
    return res.data || {};
  } catch {
    return {};
  }
}

