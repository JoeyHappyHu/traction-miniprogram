const express = require('express');
const router = express.Router();
const { getPool } = require('../services/db');

/**
 * POST /api/task/create
 * 创建新任务
 */
router.post('/create', async (req, res) => {
  const userId = req.userId;

  try {
    const [result] = await getPool().execute(
      'INSERT INTO tasks (user_id, title, status) VALUES (?, ?, ?)',
      [userId, '新的规划咨询', 'chatting']
    );

    res.json({
      taskId: result.insertId,
      title: '新的规划咨询',
      status: 'chatting'
    });
  } catch (err) {
    console.error('[Task] 创建失败:', err);
    res.status(500).json({ error: '创建任务失败' });
  }
});

/**
 * GET /api/task/list
 * 获取用户的任务列表
 */
router.get('/list', async (req, res) => {
  const userId = req.userId;

  try {
    const [tasks] = await getPool().execute(
      `SELECT t.id, t.title, t.status, t.created_at,
              (SELECT COUNT(*) FROM cards WHERE task_id = t.id) as card_count
       FROM tasks t
       WHERE t.user_id = ?
       ORDER BY t.updated_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ tasks });
  } catch (err) {
    console.error('[Task] 获取列表失败:', err);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

/**
 * GET /api/task/:taskId
 * 获取任务详情（含对话历史和卡牌）
 */
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const userId = req.userId;

  try {
    const [tasks] = await getPool().execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (tasks.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const [messages] = await getPool().execute(
      'SELECT id, role, content, phase, created_at FROM messages WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );

    const [cards] = await getPool().execute(
      'SELECT id, risk_score, risk_desc, exec_score, exec_desc, benefit_score, benefit_desc, summary, image_url, path_direction, created_at FROM cards WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );

    res.json({
      task: tasks[0],
      messages,
      cards
    });
  } catch (err) {
    console.error('[Task] 获取详情失败:', err);
    res.status(500).json({ error: '获取任务详情失败' });
  }
});

/**
 * DELETE /api/task/:taskId
 * 删除任务
 */
router.delete('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const userId = req.userId;

  try {
    const [result] = await getPool().execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Task] 删除失败:', err);
    res.status(500).json({ error: '删除任务失败' });
  }
});

module.exports = router;
