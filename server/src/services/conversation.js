/**
 * 对话状态管理
 *
 * 状态机：greeting → answering → confirming_goal → gathering_bg → ready
 *
 * 充分性判断逻辑：
 * - 已确认目标（具体、可验证）
 * - 背景信息 >= 3个维度（身份/阶段/资源/限制/动机）
 */

class ConversationManager {
  constructor() {
    this.sessions = new Map(); // taskId -> session state
  }

  /**
   * 获取或创建会话
   */
  getOrCreate(taskId) {
    if (!this.sessions.has(taskId)) {
      this.sessions.set(taskId, {
        phase: 'greeting',
        confirmedGoal: false,
        bgDimensions: new Set(), // 已收集的背景维度
        collectedInfo: {
          goal: '',
          identity: '',     // 身份/专业/职业
          stage: '',        // 当前阶段
          resources: '',    // 资源（经济/人脉等）
          constraints: '',  // 限制（时间/地域等）
          motivation: ''    // 真实动机
        },
        messageCount: 0,
        isReady: false,
        usedPaths: []       // 已生成的路径方向（用于卡牌去重）
      });
    }
    return this.sessions.get(taskId);
  }

  /**
   * 分析AI回复，更新对话状态
   * @param {string} aiReply - AI的完整回复
   * @param {string} userMessage - 用户最后一条消息
   */
  analyze(aiReply, userMessage) {
    // 检查是否包含 [READY] 标记
    const hasReady = aiReply.includes('[READY]');

    return {
      phase: hasReady ? 'ready' : this.guessPhase(),
      isReady: hasReady
    };
  }

  /**
   * 估算当前对话阶段（用于UI展示，不严格依赖AI输出）
   */
  guessPhase() {
    // 简单启发式，实际由AI的[READY]标记决定
    return 'chatting';
  }

  /**
   * 收集已了解的背景维度
   */
  collectDimension(taskId, dimension) {
    const session = this.getOrCreate(taskId);
    session.bgDimensions.add(dimension);
  }

  /**
   * 标记目标已确认
   */
  confirmGoal(taskId, goal) {
    const session = this.getOrCreate(taskId);
    session.confirmedGoal = true;
    session.collectedInfo.goal = goal;
  }

  /**
   * 记录已使用的路径方向
   */
  addUsedPath(taskId, pathDirection) {
    const session = this.getOrCreate(taskId);
    session.usedPaths.push(pathDirection);
  }

  /**
   * 获取已使用的路径
   */
  getUsedPaths(taskId) {
    return this.getOrCreate(taskId).usedPaths;
  }

  /**
   * 获取会话信息
   */
  getSession(taskId) {
    return this.getOrCreate(taskId);
  }

  /**
   * 生成用户画像摘要（给卡牌生成用）
   */
  buildProfile(taskId, messages) {
    const session = this.getOrCreate(taskId);
    // 取最近对话摘要
    const recentMsgs = messages.slice(-20); // 最近20条
    return recentMsgs.map(m => `${m.role === 'user' ? '用户' : '顾问'}：${m.content}`).join('\n');
  }

  /**
   * 清理过期会话（超过1小时未活动的）
   */
  cleanup() {
    const now = Date.now();
    for (const [taskId, session] of this.sessions) {
      if (now - (session.lastActive || 0) > 3600000) {
        this.sessions.delete(taskId);
      }
    }
  }
}

// 单例
const conversationManager = new ConversationManager();

// 每小时清理一次
setInterval(() => conversationManager.cleanup(), 3600000);

module.exports = conversationManager;
