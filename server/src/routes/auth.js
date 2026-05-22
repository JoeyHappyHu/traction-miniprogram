const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getPool } = require('../services/db');

/**
 * POST /api/auth/login
 * 微信小程序登录：code 换 openid + session_key
 */
router.post('/login', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: '缺少code' });
  }

  try {
    // 调用微信接口换取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key, errcode, errmsg } = wxRes.data;

    if (errcode) {
      console.error('[WX Login] 微信返回错误:', errcode, errmsg);
      return res.status(400).json({ error: '微信登录失败', detail: errmsg });
    }

    // 查找或创建用户
    const [existing] = await getPool().execute(
      'SELECT id, nickname, avatar_url FROM users WHERE openid = ?',
      [openid]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      // 更新 session_key
      await getPool().execute(
        'UPDATE users SET session_key = ? WHERE id = ?',
        [session_key, userId]
      );
    } else {
      const [result] = await getPool().execute(
        'INSERT INTO users (openid, session_key) VALUES (?, ?)',
        [openid, session_key]
      );
      userId = result.insertId;
    }

    // 返回 token（用 session_key 作为简单 token，生产环境建议用 JWT）
    res.json({
      token: session_key,
      userId,
      isNew: existing.length === 0
    });
  } catch (err) {
    console.error('[WX Login] 异常:', err);
    res.status(500).json({ error: '登录异常' });
  }
});

module.exports = router;
