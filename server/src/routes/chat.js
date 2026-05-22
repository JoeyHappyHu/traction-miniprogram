const express = require('express');
const router = express.Router();
const { getPool } = require('../services/db');
const { chatStream, chat } = require('../services/llm');
const { SYSTEM_PROMPT, TITLE_GENERATION_PROMPT } = require('../prompts/system');
const conversationManager = require('../services/conversation');

/**
 * POST /api/chat/send
 * 发送消息并获取AI回复（SSE流式）
 * Body: { taskId, message }
 */
router.post('/send', async (req, res) => {
  const { taskId, message } = req.body;
  const userId = req.userId;

  if (!taskId || !message) {
    return res.status(400).json({ error: '缺少参数' });
  }

  try {
    // 1. 验证任务归属
    const [tasks] = await getPool().execute(
      'SELECT id, status FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (tasks.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 2. 保存用户消息
    await getPool().execute(
      'INSERT INTO messages (task_id, role, content) VALUES (?, ?, ?)',
      [taskId, 'user', message]
    );

    // 3. 获取历史消息
    const [history] = await getPool().execute(
      'SELECT role, content FROM messages WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );

    // 构建消息列表（最近20条 + system）
    const recentHistory = history.slice(-20).map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content
    }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory
    ];

    // 4. SSE流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullReply = '';

    await chatStream(messages, (chunk) => {
      fullReply += chunk;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    });

    // 5. 分析对话状态
    const analysis = conversationManager.analyze(fullReply, message);

    // 清理 [READY] 标记（不在前端显示）
    const cleanReply = fullReply.replace(/\[READY\]/g, '').trim();

    // 6. 保存AI消息
    await getPool().execute(
      'INSERT INTO messages (task_id, role, content, phase) VALUES (?, ?, ?, ?)',
      [taskId, 'ai', cleanReply, analysis.phase]
    );

    // 7. 如果对话充分，更新任务状态
    if (analysis.isReady) {
      await getPool().execute(
        'UPDATE tasks SET status = ? WHERE id = ?',
        ['cards', taskId]
      );

      // 生成任务标题
      const title = await generateTaskTitle(history);
      await getPool().execute(
        'UPDATE tasks SET title = ? WHERE id = ?',
        [title, taskId]
      );

      // 发送任务完成事件
      res.write(`data: ${JSON.stringify({ type: 'ready', title })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[Chat] 发送失败:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '对话异常' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: '对话异常' })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/chat/history/:taskId
 * 获取对话历史
 */
router.get('/history/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const userId = req.userId;

  try {
    const [tasks] = await getPool().execute(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (tasks.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const [messages] = await getPool().execute(
      'SELECT id, role, content, phase, created_at FROM messages WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    );

    res.json({ messages });
  } catch (err) {
    console.error('[Chat] 获取历史失败:', err);
    res.status(500).json({ error: '获取历史失败' });
  }
});

/**
 * 生成任务标题
 */
async function generateTaskTitle(history) {
  const summary = history.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = TITLE_GENERATION_PROMPT.replace('{summary}', summary);

  try {
    const title = await chat([
      { role: 'user', content: prompt }
    ], { temperature: 0.3, max_tokens: 50 });
    return title.trim().replace(/^["']|["']$/g, '').slice(0, 20);
  } catch {
    return '规划咨询';
  }
}

module.exports = router;
