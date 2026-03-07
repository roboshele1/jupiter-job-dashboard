// electron/ipc/learningLoopIpc.js
// Learning loop IPC: exposes Kelly adaptation based on Performance outcomes

import {
  computeLearningAdjustments,
  getLearningState,
  applyLearningToConvictions,
} from '../../engine/learning/learningLoopEngine.js';

export function registerLearningLoopIpc(ipcMain) {

  // Compute learning adjustments from investment journal
  ipcMain.handle('learning:computeAdjustments', async (_event) => {
    try {
      const result = await computeLearningAdjustments();
      return result;
    } catch (err) {
      console.error('[learning:computeAdjustments] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  // Get current learning state
  ipcMain.handle('learning:getState', async (_event) => {
    try {
      const result = await getLearningState();
      return result;
    } catch (err) {
      console.error('[learning:getState] Failed:', err.message);
      return { ok: false, error: err.message };
    }
  });

  console.log('[IPC] Learning Loop handler registered (learning:*) ✓');
}
