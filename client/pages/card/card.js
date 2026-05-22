// pages/card/card.js - 路径情绪卡牌页
const cardService = require('../../services/card');
const { request } = require('../../utils/request');

Page({
  data: {
    taskId: null,
    cards: [],
    currentCardIndex: 0,
    currentCard: null,
    isGenerating: false,
    isExhausted: false,
    canSwitch: true
  },

  onLoad(options) {
    const { taskId } = options;
    this.setData({ taskId });
    this.loadCards();
  },

  async loadCards() {
    try {
      const res = await cardService.getCardList(this.data.taskId);
      if (res.cards && res.cards.length > 0) {
        this.setData({
          cards: res.cards,
          currentCard: res.cards[0],
          currentCardIndex: 0
        });
      } else {
        // 没有卡牌，自动生成第一张
        this.generateCard();
      }
    } catch (e) {
      // 静默处理
    }
  },

  // 生成/换牌
  async generateCard() {
    if (this.data.isGenerating) return;

    this.setData({ isGenerating: true });

    try {
      const res = await cardService.generateCard(this.data.taskId);

      if (res.exhausted) {
        this.setData({ isExhausted: true });
        wx.showToast({ title: res.message, icon: 'none' });
        return;
      }

      const newCard = res.card;
      const cards = [...this.data.cards, newCard];

      this.setData({
        cards,
        currentCard: newCard,
        currentCardIndex: cards.length - 1,
        canSwitch: newCard.remaining > 0
      });
    } catch (e) {
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    } finally {
      this.setData({ isGenerating: false });
    }
  },

  // 查看上一张
  prevCard() {
    if (this.data.currentCardIndex <= 0) return;
    const idx = this.data.currentCardIndex - 1;
    this.setData({
      currentCardIndex: idx,
      currentCard: this.data.cards[idx]
    });
  },

  // 查看下一张
  nextCard() {
    if (this.data.currentCardIndex >= this.data.cards.length - 1) return;
    const idx = this.data.currentCardIndex + 1;
    this.setData({
      currentCardIndex: idx,
      currentCard: this.data.cards[idx]
    });
  },

  // 保存海报（Canvas合成）
  savePoster() {
    const card = this.data.currentCard;
    if (!card) return;

    wx.showLoading({ title: '生成海报中...' });

    // 创建离屏canvas
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          wx.hideLoading();
          wx.showToast({ title: '生成失败', icon: 'none' });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;

        // 设置canvas尺寸 (750x1334 rpx 对应 750x1334 逻辑像素)
        const W = 750;
        const H = 1334;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        this.drawPoster(canvas, ctx, W, H, card, dpr);
      });
  },

  // 绘制海报
  drawPoster(canvas, ctx, W, H, card, dpr) {
    const serverUrl = getApp().globalData.serverUrl;
    const img = canvas.createImage();

    img.onload = () => {
      // 背景
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#1a1a2e');
      bgGrad.addColorStop(1, '#16213e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 品牌标识
      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Traction', 48, 60);

      ctx.fillStyle = '#666';
      ctx.font = '22px sans-serif';
      ctx.fillText('AI规划卡牌', 200, 58);

      // 路径标题
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(card.path_direction, 48, 140);

      // 插画（居中裁剪）
      const imgX = 48;
      const imgY = 170;
      const imgW = W - 96;
      const imgH = 520;
      // 圆角矩形裁剪
      this.roundRect(ctx, imgX, imgY, imgW, imgH, 24);
      ctx.clip();
      // 保持比例填充
      const scale = Math.max(imgW / img.width, imgH / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, imgX - (sw - imgW) / 2, imgY - (sh - imgH) / 2, sw, sh);

      // 三维度区域
      const startY = 720;
      const dimData = [
        { label: '风险', score: card.risk_score, desc: card.risk_desc, color: '#ff6b6b' },
        { label: '执行', score: card.exec_score, desc: card.exec_desc, color: '#feca57' },
        { label: '收益', score: card.benefit_score, desc: card.benefit_desc, color: '#00b894' }
      ];

      dimData.forEach((dim, i) => {
        const y = startY + i * 140;

        // 分数标签
        ctx.fillStyle = dim.color;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(dim.label, 48, y + 28);

        // 分数条背景
        ctx.fillStyle = '#2d2d44';
        this.roundRect(ctx, 120, y + 8, 340, 28, 14);
        ctx.fill();

        // 分数条填充
        const barW = 340 * (dim.score / 100);
        ctx.fillStyle = dim.color;
        this.roundRect(ctx, 120, y + 8, barW, 28, 14);
        ctx.fill();

        // 分数数字
        ctx.fillStyle = dim.color;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`${dim.score}`, 480, y + 32);

        // 描述文字（自动换行）
        ctx.fillStyle = '#bbb';
        ctx.font = '24px sans-serif';
        this.wrapText(ctx, dim.desc, 48, y + 65, W - 96, 36);
      });

      // 扎心总结
      const summaryY = startY + 440;
      ctx.fillStyle = 'rgba(108, 92, 231, 0.2)';
      this.roundRect(ctx, 32, summaryY - 16, W - 64, 80, 16);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`"${card.summary}"`, W / 2, summaryY + 28);
      ctx.textAlign = 'left';

      // 底部二维码区域（占位）
      ctx.fillStyle = '#666';
      ctx.font = '20px sans-serif';
      ctx.fillText('扫码开启你的AI规划', 48, H - 40);

      // 导出
      wx.canvasToTempFilePath({
        canvas,
        x: 0,
        y: 0,
        width: W * dpr,
        height: H * dpr,
        destWidth: W * dpr,
        destHeight: H * dpr,
        success: (res) => {
          wx.hideLoading();
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到相册', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '保存失败，请授权相册权限', icon: 'none' });
            }
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '生成失败', icon: 'none' });
        }
      });
    };

    img.onerror = () => {
      wx.hideLoading();
      wx.showToast({ title: '图片加载失败', icon: 'none' });
    };

    img.src = card.image_url.startsWith('http')
      ? card.image_url
      : `${serverUrl}${card.image_url}`;
  },

  // 圆角矩形辅助
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // 文字自动换行
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    for (let i = 0; i < text.length; i++) {
      const testLine = line + text[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = text[i];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  },

  // 返回对话页继续聊
  backToChat() {
    wx.navigateBack();
  },

  // 新任务
  newTask() {
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
