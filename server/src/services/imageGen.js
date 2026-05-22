/**
 * 通义万相图片生成服务
 * 通过 DashScope API 调用
 */
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'wanx-v1';

/**
 * 生成卡牌插画
 * @param {string} prompt - 英文提示词
 * @returns {string} 图片URL
 */
async function generateImage(prompt) {
  try {
    const response = await client.images.generate({
      model: IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('未获取到图片URL');
    }
    return imageUrl;
  } catch (err) {
    console.error('[ImageGen] 生成失败:', err.message);
    throw new Error('图片生成失败，请稍后再试');
  }
}

/**
 * 下载图片到本地并返回本地路径
 */
async function downloadImage(url, taskId, cardIndex) {
  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');

  const uploadsDir = path.join(__dirname, '../../uploads/cards');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${taskId}_${cardIndex}_${Date.now()}.png`;
  const filepath = path.join(uploadsDir, filename);

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filepath, response.data);

  return `/uploads/cards/${filename}`;
}

module.exports = { generateImage, downloadImage };
