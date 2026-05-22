// pages/login/login.js
const app = getApp()

Page({
  data: {},

  handleLogin(e) {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        
        // Call cloud function for openid if needed, but for simplicity use direct login
        wx.login({
          success: (loginRes) => {
            // In real: exchange code for openid via cloud function
            console.log('Login success', loginRes.code)
            
            wx.switchTab({
              url: '/pages/chat/chat'
            })
          }
        })
      },
      fail: () => {
        wx.showToast({ title: '需要授权才能继续', icon: 'none' })
      }
    })
  }
})