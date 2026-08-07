/**
 * Agent 触发路由
 *
 * POST /api/agent/trigger/news   - 手动触发新闻采集
 * GET  /api/agent/config         - 获取 LLM 配置（脱敏）
 * PUT  /api/agent/config         - 保存 LLM 配置
 * GET  /api/agent/runs           - 获取执行历史
 * POST /api/agent/test-llm       - 测试 LLM 连接
 */

const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { getSafeConfig, saveConfig, getConfig, chat } = require('../agents/llm');
const newsAgent = require('../agents/news-agent');
const questionAgent = require('../agents/question-agent');

const router = express.Router();

/**
 * POST /api/agent/trigger/news - 手动触发新闻采集
 */
router.post('/trigger/news', requireAdmin, async (req, res) => {
  try {
    // 异步执行，不阻塞响应
    res.json({ message: '新闻采集已启动', status: 'running' });

    // 在后台执行
    newsAgent.run('manual').catch(e => {
      console.error('[Agent Route] 新闻采集失败:', e.message);
    });
  } catch (e) {
    res.status(500).json({ error: '触发失败: ' + e.message });
  }
});

/**
 * POST /api/agent/trigger/literature - 手动触发文献采集（每周）
 * body: 无（可选 { limit }）
 */
router.post('/trigger/literature', requireAdmin, async (req, res) => {
  try {
    res.json({ message: '文献采集已启动', status: 'running' });
    newsAgent.run('manual', 'literature').catch(e => {
      console.error('[Agent Route] 文献采集失败:', e.message);
    });
  } catch (e) {
    res.status(500).json({ error: '触发失败: ' + e.message });
  }
});

/**
 * POST /api/agent/trigger/questions - 手动触发智能体出题
 * body: {
 *   count: 8,
 *   mode: 'course' | 'external',
 *   courseId: 'intro' (course 模式可选，默认全课程),
 *   text: '外部资料文本' (external 模式可选),
 *   url: 'https://...' (external 模式可选),
 *   urlLabel: '资料名称' (external 模式可选)
 * }
 */
router.post('/trigger/questions', requireAdmin, async (req, res) => {
  const { count, mode, courseId, text, url, urlLabel } = req.body || {};
  if (!['course', 'external'].includes(mode)) {
    return res.status(400).json({ error: 'mode 必须为 course 或 external' });
  }
  if (mode === 'external' && !text && !url) {
    return res.status(400).json({ error: 'external 模式需提供 text 或 url' });
  }
  try {
    res.json({ message: '出题智能体已启动，正在生成题目（可能需数十秒）', status: 'running' });
    questionAgent.run({
      count: parseInt(count) || 8,
      mode,
      courseId: courseId || null,
      scopeText: text || '',
      scopeLabel: urlLabel || '',
      scopeUrl: url || ''
    }, 'manual').catch(e => {
      console.error('[Agent Route] 出题失败:', e.message);
    });
  } catch (e) {
    res.status(500).json({ error: '触发失败: ' + e.message });
  }
});

/**
 * GET /api/agent/config - 获取 LLM 配置（脱敏）
 */
router.get('/config', requireAdmin, (req, res) => {
  res.json(getSafeConfig());
});

/**
 * PUT /api/agent/config - 保存 LLM 配置
 */
router.put('/config', requireAdmin, (req, res) => {
  const { apiKey, apiUrl, model } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey 为必填' });

  saveConfig({
    apiKey: apiKey,
    apiUrl: apiUrl || 'https://api.deepseek.com/v1',
    model: model || 'deepseek-chat'
  });

  res.json({ message: '配置保存成功' });
});

/**
 * POST /api/agent/test-llm - 测试 LLM 连接
 * 支持在 body 中传入 { apiKey, apiUrl, model } 来测试未保存的配置
 * 如果 body 为空，则使用已保存的配置
 */
router.post('/test-llm', requireAdmin, async (req, res) => {
  try {
    const { apiKey, apiUrl, model } = req.body || {};
    const overrideConfig = apiKey
      ? { apiKey, apiUrl: apiUrl || 'https://api.deepseek.com/v1', model: model || 'deepseek-chat' }
      : null;

    const reply = await chat([
      { role: 'user', content: '请回复"连接成功"四个字' }
    ], { max_tokens: 20, config: overrideConfig, timeout: 15000 });

    res.json({ success: true, reply });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/agent/status - 获取最近一次执行状态（用于轮询）
 */
router.get('/status', requireAdmin, (req, res) => {
  const run = db.prepare(`
    SELECT * FROM agent_runs ORDER BY id DESC LIMIT 1
  `).get();
  res.json({ run: run || null });
});

/**
 * GET /api/agent/runs - 获取执行历史
 */
router.get('/runs', requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const runs = db.prepare(`
    SELECT * FROM agent_runs ORDER BY id DESC LIMIT ?
  `).all(limit);
  res.json({ runs });
});

module.exports = router;
