// 微信登录鉴权中间件
const { getPool } = require('../services/db');

/**
 * 从请求头获取用户token，验证并挂载 req.userId
 * 小程序端通过 Header 传 token
 */
module.exports = async function authMiddleware(req, res, next) {
  const token = req.headers['x-auth-token'] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const [rows] = await getPool().execute(
      'SELECT id, openid, nickname FROM users WHERE session_key = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }

    req.userId = rows[0].id;
    req.userOpenid = rows[0].openid;
    next();
  } catch (err) {
    console.error('[Auth] 鉴权失败:', err);
    return res.status(500).json({ error: '鉴权失败' });
  }
};
