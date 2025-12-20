// renderer/hooks/useJupiterChat.js
export async function askJupiter(question) {
  if (!window.jupiterChat) {
    return { answer: 'Chat engine unavailable.', meta: {} };
  }
  return await window.jupiterChat.ask(question);
}

