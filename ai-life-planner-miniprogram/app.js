// app.js
App({
  globalData: {
    userInfo: null,
    cloudEnvId: 'your-cloud-env-id', // TODO: Replace with your Tencent CloudBase env ID
    chatHistory: [],
    currentPlan: null
  },

  onLaunch() {
    // Initialize CloudBase
    if (!wx.cloud) {
      console.error('Please use base library 2.2.3 or above to use cloud capabilities')
    } else {
      wx.cloud.init({
        env: this.globalData.cloudEnvId,
        traceUser: true
      })
    }

    // Check login status etc.
    this.checkLogin()
  },

  checkLogin() {
    // Placeholder for login check
  }
})