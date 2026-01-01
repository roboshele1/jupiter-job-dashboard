export function buildChatExposure(interpretation) {
  const concentration = interpretation?.portfolioSummary?.concentration || "N/A";
  const primaryDriver = interpretation?.riskSummary?.primaryDriver || null;
  const growthAlignment = interpretation?.growthSummary?.alignment || null;

  const headline = `Your portfolio is currently concentrated in ${concentration}.`;
  const context = `Your portfolio is currently concentrated in ${concentration}. The primary risk driver identified is ${primaryDriver ?? "none"}. Overall growth alignment remains ${growthAlignment ?? "aligned"}.`;

  return { headline, context };
}
