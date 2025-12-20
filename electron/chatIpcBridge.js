// electron/chatIpcBridge.js
import { ipcMain } from 'electron';
import { CHAT_IPC_CHANNELS, validateChatQuery } from '../engine/chat/ipcContract.js';
import { respondToChatQuery } from '../engine/chat/chatEngineResponder.js';

export function registerChatIPC() {
  ipcMain.handle(CHAT_IPC_CHANNELS.QUERY_ENGINE, async (_, question) => {
    if (!validateChatQuery(question)) {
      return {
        answer: 'Invalid query.',
        meta: { source: 'system', ts: Date.now() },
      };
    }
    return respondToChatQuery(question);
  });
}

