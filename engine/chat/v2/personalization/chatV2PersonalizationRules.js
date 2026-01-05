/**
 * CHAT_V2_PERSONALIZATION_RULES
 * =============================
 * Applies preset constraints to response shape ONLY
 */

export function applyPersonalizationRules({ response, preset }) {
  const trimmedBullets = Array.isArray(response.bullets)
    ? response.bullets.slice(0, preset.maxBullets)
    : [];

  return {
    ...response,
    bullets: trimmedBullets,
    sections: response.sections || {},
  };
}
