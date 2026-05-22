// services/card.js
const { request } = require('../utils/request');

/**
 * 生成卡牌
 */
function generateCard(taskId) {
  return request('/api/card/generate', {
    method: 'POST',
    data: { taskId }
  });
}

/**
 * 获取任务的所有卡牌
 */
function getCardList(taskId) {
  return request(`/api/card/list/${taskId}`);
}

module.exports = { generateCard, getCardList };
