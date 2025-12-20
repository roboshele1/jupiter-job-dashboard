// engine/chat/ipcContract.js
// READ-ONLY IPC surface for Chat → Engine

export const CHAT_IPC_CHANNELS = {
  QUERY_ENGINE: 'chat:query-engine',
};

export function validateChatQuery(input) {
  if (typeof input !== 'string') return false;
  if (input.length === 0) return false;
  if (input.length > 500) return false;
  return true;
}

