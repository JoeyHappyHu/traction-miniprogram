// pages/index/index.js - 首页
const { request } = require('../../utils/request');

Page({
  data: {
    hasTask: false,
    currentTaskId: null,
    recentTasks: []
  },

  onShow() {
    this.loadRecentTasks();
  },

  async loadRecentTasks() {
    try {
      const res = await request('/api/task/list');
      this.setData({
        recentTasks: res.tasks.slice(0, 5),
        hasTask: res.tasks.length > 0
      });
    } catch (e) {
      // 静默处理
    }
  },

  // 开始新任务
  async startNewTask() {
    wx.showLoading({ title: '创建中...' });
    try {
      const res = await request('/api/task/create', { method: 'POST' });
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/chat/chat?taskId=${res.taskId}`
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  // 打开任务
  openTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;

    if (status === 'chatting') {
      wx.navigateTo({ url: `/pages/chat/chat?taskId=${taskId}` });
    } else {
      wx.navigateTo({ url: `/pages/card/card?taskId=${taskId}` });
    }
  },

  // 查看全部历史
  viewHistory() {
    wx.switchTab({ url: '/pages/history/history' });
  }
});
