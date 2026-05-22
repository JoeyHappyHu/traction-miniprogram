// pages/cards/cards.js
const app = getApp()

Page({
  data: {
    cards: [
      {
        id: 1,
        title: '创业突破卡',
        imageUrl: 'https://picsum.photos/id/1005/600/400', // Replace with real generated chibi via CloudBase hunyuan-image
        riskScore: 65,
        riskDesc: '市场竞争激烈，可能面临资金短缺。',
        executionScore: 80,
        executionDesc: '先验证MVP，3个月内获取种子轮。',
        benefitScore: 90,
        benefitDesc: '实现财务自由与个人品牌提升，对未来职业有深远影响。'
      },
      {
        id: 2,
        title: '深造进阶卡',
        imageUrl: 'https://picsum.photos/id/1011/600/400',
        riskScore: 40,
        riskDesc: '时间投入大，机会成本较高。',
        executionScore: 75,
        executionDesc: '报考目标院校，同步积累项目经验。',
        benefitScore: 85,
        benefitDesc: '提升专业能力，打开高端职位通道，长期回报显著。'
      }
      // Add 3-5 total in real impl
    ],
    selectedCard: null
  },

  onLoad() {
    // In real: fetch from global or call cloud to generate based on chat profile
    // this.generateRealCards()
  },

  selectCard(e) {
    const id = e.currentTarget.dataset.id
    const card = this.data.cards.find(c => c.id === id)
    this.setData({ selectedCard: card })
    
    this.shareToMoments(card)
  },

  async shareToMoments(card) {
    // Generate custom share image using Canvas (for Moments 5:4 ratio)
    // Then use onShareTimeline with imageUrl
    
    wx.showLoading({ title: '生成分享图...' })
    
    // Simulate image generation + upload to CloudBase
    setTimeout(() => {
      wx.hideLoading()
      
      // For real: use wx.canvasToTempFilePath + wx.cloud.uploadFile
      // Then set share params
      
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
      
      // Trigger share
      wx.shareToMoments ? wx.shareToMoments() : this.fallbackShare(card)
    }, 1200)
  },

  fallbackShare(card) {
    wx.showModal({
      title: '分享到朋友圈',
      content: `已生成卡牌图片，请手动保存并分享。\n卡牌：${card.title}`,
      showCancel: false
    })
  },

  // Lifecycle for Moments share
  onShareTimeline() {
    const card = this.data.selectedCard || this.data.cards[0]
    return {
      title: `我的未来规划卡：${card.title}`,
      imageUrl: card.imageUrl,
      query: `cardId=${card.id}`
    }
  },

  onShareAppMessage() {
    const card = this.data.selectedCard || this.data.cards[0]
    return {
      title: `AI 为我生成的规划卡牌`,
      imageUrl: card.imageUrl,
      path: `/pages/cards/cards?cardId=${card.id}`
    }
  }
})