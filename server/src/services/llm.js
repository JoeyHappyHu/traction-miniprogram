/**
 * 通义千问 LLM 服务封装
 * 兼容 OpenAI SDK 格式，通过 DashScope API 调用
 */
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

const MODEL = process.env.LLM_MODEL || 'qwen-turbo';

/**
 * 非流式对话
 * @param {Array} messages - [{role, content}]
 * @param {Object} options - { temperature, max_tokens }
 * @returns {string} AI回复内容
 */
async function chat(messages, options = {}) {
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      ...options
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('[LLM] 调用失败:', err.message);
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
}

/**
 * 流式对话
 * @param {Array} messages - [{role, content}]
 * @param {Function} onChunk - (text: string) => void
 * @param {Object} options
 * @returns {Promise<string>} 完整回复
 */
async function chatStream(messages, onChunk, options = {}) {
  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      stream: true,
      ...options
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        if (onChunk) onChunk(delta);
      }
    }
    return fullText;
  } catch (err) {
    console.error('[LLM] 流式调用失败:', err.message);
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
}

/**
 * 带JSON输出的对话（用于卡牌生成等结构化输出）
 * @param {Array} messages
 * @param {Object} jsonSchema - JSON Schema 约束
 * @returns {Object} 解析后的JSON对象
 */
async function chatJSON(messages, options = {}) {
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      response_format: { type: 'json_object' },
      ...options
    });
    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (err) {
    console.error('[LLM] JSON调用失败:', err.message);
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
}

module.exports = { chat, chatStream, chatJSON, MODEL };
