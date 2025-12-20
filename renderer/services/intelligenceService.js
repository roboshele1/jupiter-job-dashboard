/**
 * Intelligence Service (Renderer)
 */

export async function runIntelligence(snapshot = "T0") {
  return window.api.invoke("intelligence:run", snapshot, []);
}

