import { buildChatExposure } from "../../engine/llm/chatExposureBuilder.js";

export function buildChatInsight(interpretation) {
  const chatExposure = buildChatExposure(interpretation);

  return {
    headline: chatExposure.headline || "No dominant signals detected",
    context: chatExposure.context || "Portfolio data is available, but no dominant risk or growth signals are currently elevated.",
    footer: "Observer mode only. Descriptive summary based on current portfolio interpretation. No advice or actions implied.",
  };
}
