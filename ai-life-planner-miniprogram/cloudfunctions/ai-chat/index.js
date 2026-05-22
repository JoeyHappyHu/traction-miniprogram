// cloudfunctions/ai-chat/index.js
// Real implementation: Use wx.cloud.extend.AI to call LLM with SYSTEM_PROMPT
// Supports streaming via streamText or bot

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { messages, userProfile, phase } = event

  // TODO: Integrate with wx.cloud.extend.AI.createModel() or bot.sendMessage()
  // Example:
  // const ai = cloud.extend.AI
  // const model = ai.createModel({ model: 'hunyuan' })
  // const res = await model.streamText({ prompt: buildPrompt(messages, phase) ... })

  // For demo return mock
  return {
    reply: 'AI回复：基于你的输入，继续引导确认目标...',
    newPhase: phase === 'background' ? 'ready' : 'background',
    extractedInfo: { goal: '示例目标' }
  }
}