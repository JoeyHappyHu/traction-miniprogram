// services/chat.js
const { request, requestStream } = require('../utils/request');

/**
 * 发送对话消息（流式）
 */
function sendMessage(taskId, message, onChunk, onReady, onDone, onError) {
  return requestStream(
    '/api/chat/send',
    { taskId, message },
    (event) => {
      switch (event.type) {
        case 'chunk':
          if (onChunk) onChunk(event.content);
          break;
        case 'ready':
          if (onReady) onReady(event);
          break;
        case 'done':
          if (onDone) onDone();
          break;
        case 'error':
          if (onError) onError(event.message);
          break;
      }
    },
    () => {
      // 流结束
      if (onDone) onDone();
    }
  );
}

/**
 * 获取对话历史
 */
function getHistory(taskId) {
  return request(`/api/chat/history/${taskId}`);
}

module.exports = { sendMessage, getHistory };
