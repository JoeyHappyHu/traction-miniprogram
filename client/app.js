// app.js - 小程序入口
App({
  globalData: {
    userInfo: null,
    token: null,
    serverUrl: 'https://your-domain.com' // 部署时替换为实际域名
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    } else {
      this.login();
    }
  },

  // 微信登录
  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${this.globalData.serverUrl}/api/auth/login`,
            method: 'POST',
            data: { code: res.code },
            success: (resp) => {
              if (resp.data.token) {
                this.globalData.token = resp.data.token;
                wx.setStorageSync('token', resp.data.token);
              }
            },
            fail: (err) => {
              console.error('登录请求失败:', err);
            }
          });
        }
      }
    });
  },

  // 确保已登录，未登录则等待
  ensureLogin() {
    return new Promise((resolve) => {
      if (this.globalData.token) {
        resolve(this.globalData.token);
      } else {
        const timer = setInterval(() => {
          if (this.globalData.token) {
            clearInterval(timer);
            resolve(this.globalData.token);
          }
        }, 200);
        // 5秒超时
        setTimeout(() => {
          clearInterval(timer);
          resolve(null);
        }, 5000);
      }
    });
  }
});
