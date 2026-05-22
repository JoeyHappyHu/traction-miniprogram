const express = require('express');
const router = express.Router();
const { generateCard } = require('../services/cardGenerator');

/**
 * POST /api/card/generate
 * 生成一张路径情绪卡牌
 * Body: { taskId }
 */
router.post('/generate', async (req, res) => {
  const { taskId } = req.body;
  const userId = req.userId;

  if (!taskId) {
    return res.status(400).json({ error: '缺少taskId' });
  }

  try {
    const result = await generateCard(taskId, userId);

    if (result.exhausted) {
      return res.json({ exhausted: true, message: result.message });
    }

    res.json({ card: result.card });
  } catch (err) {
    console.error('[Card] 生成失败:', err);
    res.status(500).json({ error: err.message || '卡牌生成失败' });
  }
});

/**
 * GET /api/card/list/:taskId
 * 获取任务下的所有卡牌
 */
router.get('/list/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const userId = req.userId;

  try {
    // 验证任务归属
    const { getPool } = require('../services/db');
    const [tasks] = await getPool().execute(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (tasks.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const [cards] = await getPool().execute(
      'SELECT * FROM cards WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );

    res.json({ cards });
  } catch (err) {
    console.error('[Card] 获取卡牌列表失败:', err);
    res.status(500).json({ error: '获取卡牌失败' });
  }
});

module.exports = router;
