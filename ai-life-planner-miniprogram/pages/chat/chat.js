// pages/chat/chat.js
const app = getApp()

// Strict system prompt enforcing all rules: one Q at a time, confirm goal before plan, first-principles, Socratic, Occam, etc.
const SYSTEM_PROMPT = `You are a senior life/career planning expert using First Principles, Occam's Razor, and Socratic questioning.
Rules (NEVER break):
- Answer user's basic question directly then ask for true intention to confirm goal.
- Use one question at a time (max 2-3 closely related). Wait for answer before next.
- Confirm SPECIFIC, VERIFIABLE goal node before any planning.
- Gather background, resources, constraints gradually via natural chat, not questionnaires.
- NEVER give full plan or multiple questions at once.
- If goal vague, guide with suggestions but confirm.
- Challenge assumptions with piercing follow-ups.
- Only after goal confirmed + background collected, say "READY_TO_GENERATE" to trigger cards.
- All suggestions creative, tied to user's stated background/goals.
- Keep responses friendly, natural WeChat-chat style.
- Output in Chinese.

Current user profile so far: {{profile}}
Conversation phase: {{phase}}`

Page({
  data: {
    messages: [],
    inputValue: '',
    isTyping: false,
    scrollTo: '',
    showGenerateBtn: false,
    phase: 'answer_question', // answer_question -> confirm_goal -> background -> ready
    profile: {},
    collectedInfo: []
  },

  onLoad() {
    // Start with greeting
    this.addAIMessage('你好！我是你的资深人生规划专家。我们先聊聊你当前的想法或困惑吧？')
  },

  addMessage(role, content) {
    const msg = { id: Date.now(), role, content }
    this.setData({
      messages: [...this.data.messages, msg],
      scrollTo: `msg-${msg.id}`
    })
    return msg
  },

  addAIMessage(content) {
    this.addMessage('ai', content)
  },

  sendMessage() {
    const value = this.data.inputValue.trim()
    if (!value || this.data.isTyping) return

    this.addMessage('user', value)
    this.setData({ inputValue: '' })

    this.callAI(value)
  },

  async callAI(userInput) {
    this.setData({ isTyping: true })

    // In production: call cloud function with full history + SYSTEM_PROMPT
    // wx.cloud.callFunction({ name: 'ai-chat', data: { messages: [...], prompt: SYSTEM_PROMPT, phase: this.data.phase } })
    
    // For now, simulate intelligent response based on phase (rule-enforcing logic)
    setTimeout(() => {
      let aiReply = ''
      const phase = this.data.phase

      if (phase === 'answer_question') {
        aiReply = `明白了你提到“${userInput}”。你的真实意图是想解决什么具体问题呢？或者你心里有一个大概的目标方向吗？`
        this.setData({ phase: 'confirm_goal' })
      } else if (phase === 'confirm_goal') {
        aiReply = `好的，我们先确认一个具体可验证的目标吧。比如“2027年拿到XX证书并进入XX行业”这样的。你的目标节点是什么？`
        this.setData({ phase: 'background' })
      } else if (phase === 'background') {
        aiReply = `了解了。关于你当前的状态、资源或限制，能再多说一点吗？比如时间、技能、家庭支持等。`
        // After a couple, move to ready
        if (this.data.messages.length > 6) {
          aiReply = `信息收集得差不多了。基于你的背景和目标，我现在可以为你生成3-5张未来规划情绪卡牌了。准备好了吗？`
          this.setData({ phase: 'ready', showGenerateBtn: true })
        }
      } else {
        aiReply = '请告诉我更多细节，我会继续引导。'
      }

      this.addAIMessage(aiReply)
      this.setData({ isTyping: false })
    }, 800)
  },

  generateCards() {
    wx.navigateTo({
      url: '/pages/cards/cards'
    })
    // In real: pass collected profile to cards page or trigger cloud generate
  },

  onScrollToBottom() {
    // auto scroll handled by scroll-into-view
  }
})