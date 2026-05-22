const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authMiddleware = require('./middleware/auth');
const chatRoutes = require('./routes/chat');
const cardRoutes = require('./routes/card');
const taskRoutes = require('./routes/task');
const { initDB } = require('./services/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件（生成的卡牌图片）
app.use('/uploads', express.static('uploads'));

// 微信登录（无需鉴权）
app.post('/api/auth/login', require('./routes/auth'));

// 以下路由需要鉴权
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/card', authMiddleware, cardRoutes);
app.use('/api/task', authMiddleware, taskRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动
async function main() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`[traction-planner] 服务启动 http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
