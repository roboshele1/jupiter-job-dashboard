export async function runGrowthSnapshot(jupiter) {
  if (!jupiter?.invoke) {
    throw new Error("IPC bridge unavailable");
  }

  return await jupiter.invoke("growthEngine:run");
}

