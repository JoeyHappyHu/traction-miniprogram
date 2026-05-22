/**
 * 卡牌生成器
 *
 * 流程：用户画像 → LLM生成卡牌内容 → 图片生成 → 保存 → 返回
 */
const { getPool } = require('./db');
const { chatJSON } = require('./llm');
const { generateImage, downloadImage } = require('./imageGen');
const { CARD_GENERATION_PROMPT } = require('../prompts/system');
const conversationManager = require('./conversation');

const MAX_CARDS_PER_TASK = 5; // 每个任务最多5张卡牌

/**
 * 生成一张路径情绪卡牌
 * @param {number} taskId - 任务ID
 * @param {number} userId - 用户ID
 * @returns {Object} 卡牌数据
 */
async function generateCard(taskId, userId) {
  // 1. 检查任务归属和状态
  const [tasks] = await getPool().execute(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );
  if (tasks.length === 0) {
    throw new Error('任务不存在');
  }

  const task = tasks[0];

  // 2. 检查卡牌数量上限
  const [cardCount] = await getPool().execute(
    'SELECT COUNT(*) as cnt FROM cards WHERE task_id = ?',
    [taskId]
  );
  if (cardCount[0].cnt >= MAX_CARDS_PER_TASK) {
    return { exhausted: true, message: '已经为你探索了所有可能的路径了' };
  }

  // 3. 获取对话历史
  const [messages] = await getPool().execute(
    'SELECT role, content FROM messages WHERE task_id = ? ORDER BY created_at ASC',
    [taskId]
  );

  // 4. 获取已生成的路径（避免重复）
  const [existingCards] = await getPool().execute(
    'SELECT path_direction FROM cards WHERE task_id = ?',
    [taskId]
  );
  const historyPaths = existingCards.map(c => c.path_direction).join('、') || '无';

  // 5. 构建用户画像
  const profile = messages.slice(-20).map(m =>
    `${m.role === 'user' ? '用户' : '顾问'}：${m.content}`
  ).join('\n');

  // 6. 生成卡牌内容
  const cardPrompt = CARD_GENERATION_PROMPT
    .replace('{userProfile}', profile)
    .replace('{historyPaths}', historyPaths);

  let cardData;
  try {
    cardData = await chatJSON([
      { role: 'system', content: '你是一个创意策划师。只输出JSON，不要其他内容。' },
      { role: 'user', content: cardPrompt }
    ], { temperature: 0.9, max_tokens: 2048 });
  } catch (err) {
    console.error('[CardGen] LLM生成卡牌内容失败:', err);
    throw new Error('卡牌生成失败，请重试');
  }

  // 7. 校验分数合理性
  cardData.risk_score = clampScore(cardData.risk_score);
  cardData.exec_score = clampScore(cardData.exec_score);
  cardData.benefit_score = clampScore(cardData.benefit_score);

  // 8. 生成插画
  let imageUrl = '';
  try {
    const remoteUrl = await generateImage(cardData.image_prompt);
    imageUrl = await downloadImage(remoteUrl, taskId, cardCount[0].cnt);
  } catch (err) {
    console.error('[CardGen] 图片生成失败，使用占位图:', err.message);
    imageUrl = '/uploads/cards/placeholder.png';
  }

  // 9. 保存到数据库
  const [result] = await getPool().execute(
    `INSERT INTO cards (task_id, risk_score, risk_desc, exec_score, exec_desc,
      benefit_score, benefit_desc, summary, image_url, path_direction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      taskId,
      cardData.risk_score, cardData.risk_desc?.slice(0, 200) || '',
      cardData.exec_score, cardData.exec_desc?.slice(0, 200) || '',
      cardData.benefit_score, cardData.benefit_desc?.slice(0, 200) || '',
      cardData.summary?.slice(0, 300) || '',
      imageUrl,
      cardData.path_direction?.slice(0, 100) || '新路径'
    ]
  );

  // 10. 记录已使用路径
  conversationManager.addUsedPath(taskId, cardData.path_direction);

  // 11. 检查是否已达到上限
  const remaining = MAX_CARDS_PER_TASK - cardCount[0].cnt - 1;

  return {
    exhausted: false,
    card: {
      id: result.insertId,
      risk_score: cardData.risk_score,
      risk_desc: cardData.risk_desc,
      exec_score: cardData.exec_score,
      exec_desc: cardData.exec_desc,
      benefit_score: cardData.benefit_score,
      benefit_desc: cardData.benefit_desc,
      summary: cardData.summary,
      image_url: imageUrl,
      path_direction: cardData.path_direction,
      remaining
    }
  };
}

function clampScore(score) {
  const s = parseInt(score) || 50;
  return Math.max(0, Math.min(100, s));
}

module.exports = { generateCard, MAX_CARDS_PER_TASK };
