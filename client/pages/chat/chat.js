// pages/chat/chat.js - AI对话页
const chatService = require('../../services/chat');
const { request } = require('../../utils/request');

Page({
  data: {
    taskId: null,
    messages: [],
    inputText: '',
    isSending: false,
    isReady: false,          // 对话是否充分
    currentAiText: '',       // 当前AI正在输出的文字（流式）
    isStreaming: false
  },

  onLoad(options) {
    const { taskId } = options;
    this.setData({ taskId });
    this.loadHistory();

    // 如果是新任务，发送开场白
    if (taskId) {
      this.sendWelcome();
    }
  },

  async loadHistory() {
    try {
      const res = await chatService.getHistory(this.data.taskId);
      if (res.messages && res.messages.length > 0) {
        const messages = res.messages.map(m => ({
          ...m,
          content: m.content.replace(/\[READY\]/g, '')
        }));
        this.setData({ messages });

        // 检查任务状态
        const taskRes = await request(`/api/task/${this.data.taskId}`);
        if (taskRes.task.status !== 'chatting') {
          this.setData({ isReady: true });
        }

        this.scrollToBottom();
      }
    } catch (e) {
      // 新任务没有历史
    }
  },

  // 发送开场白触发AI回复
  async sendWelcome() {
    try {
      const res = await request(`/api/task/${this.data.taskId}`);
      if (res.messages && res.messages.length === 0) {
        // 真正新任务，触发AI开场
        await this.doSend('你好');
      }
    } catch (e) {
      // 忽略
    }
  },

  // 输入框事件
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 发送消息
  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isSending) return;

    this.setData({ inputText: '', isSending: true });
    await this.doSend(text);
  },

  async doSend(text) {
    // 添加用户消息到UI
    const userMsg = { role: 'user', content: text, id: Date.now() };
    const messages = [...this.data.messages, userMsg];
    this.setData({ messages, isStreaming: true, currentAiText: '' });
    this.scrollToBottom();

    // 创建AI消息占位
    const aiMsgId = Date.now() + 1;
    const aiMsg = { role: 'ai', content: '', id: aiMsgId };
    this.setData({
      messages: [...this.data.messages, aiMsg]
    });

    try {
      await chatService.sendMessage(
        this.data.taskId,
        text,
        // onChunk
        (chunk) => {
          this.setData({
            currentAiText: this.data.currentAiText + chunk
          });
          // 更新最后一条AI消息
          const msgs = this.data.messages;
          msgs[msgs.length - 1].content = this.data.currentAiText;
          this.setData({ messages: msgs });
          this.scrollToBottom();
        },
        // onReady
        (event) => {
          this.setData({ isReady: true });
          if (event.title) {
            // 更新任务标题
            wx.setNavigationBarTitle({ title: event.title });
          }
        },
        // onDone
        () => {
          this.setData({
            isSending: false,
            isStreaming: false,
            currentAiText: ''
          });
          this.scrollToBottom();
        },
        // onError
        (errMsg) => {
          this.setData({
            isSending: false,
            isStreaming: false,
            currentAiText: ''
          });
          wx.showToast({ title: errMsg || '对话出错', icon: 'none' });
        }
      );
    } catch (err) {
      this.setData({ isSending: false, isStreaming: false, currentAiText: '' });
      wx.showToast({ title: '发送失败', icon: 'none' });
    }
  },

  // 生成卡牌
  goToCards() {
    wx.navigateTo({
      url: `/pages/card/card?taskId=${this.data.taskId}`
    });
  },

  // 滚动到底部
  scrollToBottom() {
    wx.createSelectorQuery().select('.chat-messages').boundingClientRect((rect) => {
      if (rect) {
        wx.pageScrollTo({ scrollTop: 99999, duration: 200 });
      }
    }).exec();
  }
});
