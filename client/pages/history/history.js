// pages/history/history.js
const { request } = require('../../utils/request');

Page({
  data: {
    tasks: [],
    loading: true
  },

  onShow() {
    this.loadTasks();
  },

  async loadTasks() {
    this.setData({ loading: true });
    try {
      const res = await request('/api/task/list');
      this.setData({ tasks: res.tasks || [], loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  openTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;

    if (status === 'chatting') {
      wx.navigateTo({ url: `/pages/chat/chat?taskId=${taskId}` });
    } else {
      wx.navigateTo({ url: `/pages/card/card?taskId=${taskId}` });
    }
  },

  async deleteTask(e) {
    const taskId = e.currentTarget.dataset.id;

    const { showActionSheet } = wx;
    wx.showActionSheet({
      itemList: ['删除此规划'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          try {
            await request(`/api/task/${taskId}`, { method: 'DELETE' });
            wx.showToast({ title: '已删除' });
            this.loadTasks();
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
