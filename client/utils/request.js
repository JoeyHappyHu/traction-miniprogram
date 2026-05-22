// utils/request.js - 请求封装
const app = getApp();

/**
 * 普通请求
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token;
    if (!token && options.auth !== false) {
      // 静默登录
      app.login();
      setTimeout(() => {
        request(url, options).then(resolve).catch(reject);
      }, 1500);
      return;
    }

    wx.request({
      url: `${app.globalData.serverUrl}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token || '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // token过期，重新登录
          wx.removeStorageSync('token');
          app.globalData.token = null;
          app.login();
          reject(new Error('请重新登录'));
        } else {
          reject(new Error(res.data.error || '请求失败'));
        }
      },
      fail: (err) => {
        reject(new Error('网络错误'));
      }
    });
  });
}

/**
 * SSE流式请求（通过 enableChunked）
 */
function requestStream(url, data, onMessage, onComplete) {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token;

    const requestTask = wx.request({
      url: `${app.globalData.serverUrl}${url}`,
      method: 'POST',
      data,
      header: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token || ''
      },
      enableChunked: true,
      responseType: 'text',
      success: () => {
        resolve();
      },
      fail: (err) => {
        reject(new Error('网络错误'));
      }
    });

    let buffer = '';

    // 处理分块数据
    requestTask.onChunkedResponse(({ data }) => {
      // 将 ArrayBuffer 转为字符串
      const chunk = arrayBufferToString(data);
      buffer += chunk;

      // 按 \n\n 分割 SSE 事件
      const parts = buffer.split('\n\n');
      // 最后一个可能不完整，保留在 buffer
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part.startsWith('data: ')) {
          try {
            const jsonStr = part.slice(6);
            const event = JSON.parse(jsonStr);
            if (onMessage) onMessage(event);
          } catch (e) {
            // 解析失败，跳过
          }
        }
      }
    });

    // 监听完成
    const originalComplete = requestTask.onChunkedResponse;
    // 使用 setTimeout 检测流结束
    let lastChunkTime = Date.now();
    const checkTimer = setInterval(() => {
      if (Date.now() - lastChunkTime > 3000 && !buffer) {
        clearInterval(checkTimer);
        if (onComplete) onComplete();
      }
    }, 1000);
  });
}

function arrayBufferToString(buffer) {
  const uint8Array = new Uint8Array(buffer);
  let str = '';
  // 尝试 UTF-8 解码
  try {
    const decoder = new TextDecoder('utf-8');
    str = decoder.decode(uint8Array);
  } catch {
    for (let i = 0; i < uint8Array.length; i++) {
      str += String.fromCharCode(uint8Array[i]);
    }
  }
  return str;
}

module.exports = { request, requestStream };
