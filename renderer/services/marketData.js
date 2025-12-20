/**
 * marketData.js
 * Renderer-side price access
 */

export async function getLivePrice(asset) {
  if (!window.ipc) {
    throw new Error("IPC bridge not available");
  }

  return window.ipc.getLivePrice(asset);
}

