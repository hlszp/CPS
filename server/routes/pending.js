/**
 * 待审核内容路由
 *
 * GET    /api/pending           - 列表 (?status=pending&agent_type=news)
 * GET    /api/pending/:id       - 详情
 * PUT    /api/pending/:id       - 编辑内容（管理员）
 * POST   /api/pending/:id/approve - 批准并发布（管理员）
 * POST   /api/pending/:id/reject  - 拒绝（管理员）
 * DELETE /api/pending/:id        - 删除（管理员）
 * GET    /api/pending/stats      - 统计（管理员）
 */

const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 合法题型
const QUESTION_CATEGORIES = ['theory_single', 'theory_multiple', 'theory_judge',
  'practice_single', 'practice_multiple', 'practice_case'];

/**
 * 生成自动出题的题目 ID
 */
function genQuestionId() {
  return 'AI' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * 将一条 agent_type='question' 的 pending 内容写入 questions 表
 */
function insertQuestionFromPending(item) {
  let c = {};
  try { c = JSON.parse(item.content); } catch (e) { throw new Error('题目内容解析失败'); }
  if (!c.question || !c.answer) throw new Error('题目缺少题干或答案，无法发布');
  const category = QUESTION_CATEGORIES.includes(c.category) ? c.category : 'theory_single';
  const id = genQuestionId();
  db.prepare(`
    INSERT OR IGNORE INTO questions (id, category, question, options, answer, explanation, source, difficulty, weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, category, c.question, c.options ? JSON.stringify(c.options) : null,
    c.answer, c.explanation || null, c.source || item.source || null,
    c.difficulty || 'medium', c.weight || 2);
  return id;
}

/**
 * GET /api/pending/stats - 统计
 */
router.get('/stats', requireAdmin, (req, res) => {
  const pending = db.prepare("SELECT COUNT(*) as c FROM pending_updates WHERE status = 'pending'").get();
  const approved = db.prepare("SELECT COUNT(*) as c FROM pending_updates WHERE status = 'approved'").get();
  const rejected = db.prepare("SELECT COUNT(*) as c FROM pending_updates WHERE status = 'rejected'").get();
  const published = db.prepare("SELECT COUNT(*) as c FROM pending_updates WHERE status = 'published'").get();

  const byType = db.prepare(`
    SELECT agent_type, status, COUNT(*) as c
    FROM pending_updates GROUP BY agent_type, status
  `).all();

  const recentRuns = db.prepare(`
    SELECT * FROM agent_runs ORDER BY id DESC LIMIT 10
  `).all();

  res.json({
    counts: { pending: pending.c, approved: approved.c, rejected: rejected.c, published: published.c },
    byType,
    recentRuns
  });
});

/**
 * GET /api/pending - 列表
 */
router.get('/', requireAdmin, (req, res) => {
  const { status, agent_type, min_confidence } = req.query;
  let sql = 'SELECT * FROM pending_updates WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  } else {
    sql += " AND status = 'pending'";
  }
  if (agent_type) {
    sql += ' AND agent_type = ?';
    params.push(agent_type);
  }
  if (min_confidence !== undefined && min_confidence !== '') {
    sql += ' AND ai_confidence >= ?';
    params.push(parseFloat(min_confidence));
  }
  sql += ' ORDER BY created_at DESC LIMIT 100';

  const items = db.prepare(sql).all(...params);

  // 解析 content JSON
  const parsed = items.map(item => {
    try {
      item.contentParsed = JSON.parse(item.content);
    } catch (e) {
      item.contentParsed = {};
    }
    return item;
  });

  res.json({ items: parsed });
});

/**
 * POST /api/pending/batch-approve - 批量批准并发布
 * body: { ids: ['id1', 'id2', ...] }
 */
router.post('/batch-approve', requireAdmin, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供待批准的条目 ID 列表' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const items = db.prepare(
    `SELECT * FROM pending_updates WHERE id IN (${placeholders}) AND status = 'pending'`
  ).all(...ids);

  if (items.length === 0) {
    return res.json({ message: '没有待批准的条目', published: 0 });
  }

  let publishedCount = 0;
  const insertNews = db.prepare(`
    INSERT INTO news (category, title, summary, content, source, source_url, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updatePending = db.prepare(`
    UPDATE pending_updates SET status = 'published', reviewed_at = datetime('now'), reviewed_by = ?
    WHERE id = ?
  `);

  const tx = db.transaction(() => {
    for (const item of items) {
      let contentObj = {};
      try { contentObj = JSON.parse(item.content); } catch (e) {}

      if (item.agent_type === 'question') {
        insertQuestionFromPending(item);
      } else if (item.agent_type === 'news') {
        insertNews.run(
          contentObj.category || 'research',
          item.title,
          item.summary,
          contentObj.content || contentObj.summary || '',
          item.source || contentObj.source || '',
          item.source_url || '',
          contentObj.published_at || new Date().toISOString()
        );
      }
      updatePending.run(req.user.email, item.id);
      publishedCount++;
    }
  });
  tx();

  res.json({ message: `已批量批准 ${publishedCount} 条`, published: publishedCount, skipped: ids.length - items.length });
});

/**
 * POST /api/pending/batch-reject - 批量拒绝
 * body: { ids: ['id1', 'id2', ...], notes: '可选拒绝原因' }
 */
router.post('/batch-reject', requireAdmin, (req, res) => {
  const { ids, notes } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供待拒绝的条目 ID 列表' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`
    UPDATE pending_updates SET status = 'rejected', reviewed_at = datetime('now'), reviewed_by = ?, reviewer_notes = ?
    WHERE id IN (${placeholders}) AND status = 'pending'
  `).run(req.user.email, notes || null, ...ids);

  res.json({ message: `已批量拒绝 ${result.changes} 条`, rejected: result.changes });
});

/**
 * GET /api/pending/:id - 详情
 */
router.get('/:id', requireAdmin, (req, res) => {
  const item = db.prepare('SELECT * FROM pending_updates WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '条目不存在' });
  try {
    item.contentParsed = JSON.parse(item.content);
  } catch (e) {
    item.contentParsed = {};
  }
  res.json({ item });
});

/**
 * PUT /api/pending/:id - 编辑（修改标题、摘要、内容等）
 */
router.put('/:id', requireAdmin, (req, res) => {
  const { title, summary, content, category } = req.body;
  const item = db.prepare('SELECT * FROM pending_updates WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '条目不存在' });

  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (summary !== undefined) { updates.push('summary = ?'); params.push(summary); }

  if (content !== undefined || category !== undefined) {
    let contentObj = {};
    try { contentObj = JSON.parse(item.content); } catch (e) {}
    if (category !== undefined) contentObj.category = category;
    if (content !== undefined) {
      // content 可以是完整 JSON 字符串或纯文本
      try {
        const parsed = JSON.parse(content);
        contentObj = { ...contentObj, ...parsed };
      } catch (e) {
        contentObj.content = content;
      }
    }
    updates.push('content = ?');
    params.push(JSON.stringify(contentObj));
  }

  if (updates.length === 0) return res.json({ message: '无更新' });

  params.push(req.params.id);
  db.prepare(`UPDATE pending_updates SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ message: '更新成功' });
});

/**
 * POST /api/pending/:id/approve - 批准并发布
 *
 * 对于 news 类型：直接写入 news 表
 * 对于 question 类型：写入 questions 表
 * 对于 knowledge 类型：写入 knowledge_graph
 */
router.post('/:id/approve', requireAdmin, (req, res) => {
  const item = db.prepare('SELECT * FROM pending_updates WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '条目不存在' });
  if (item.status !== 'pending') return res.status(400).json({ error: '该条目已处理' });

  let contentObj = {};
  try { contentObj = JSON.parse(item.content); } catch (e) {}

  let publishedId = null;

  // 根据类型发布到不同表
  if (item.agent_type === 'question') {
    publishedId = insertQuestionFromPending(item);
  } else if (item.agent_type === 'news') {
    const result = db.prepare(`
      INSERT INTO news (category, title, summary, content, source, source_url, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      contentObj.category || 'research',
      item.title,
      item.summary,
      contentObj.content || contentObj.summary || '',
      item.source || contentObj.source || '',
      item.source_url || '',
      contentObj.published_at || new Date().toISOString()
    );
    publishedId = result.lastInsertRowid;
  }

  // 更新 pending 状态
  db.prepare(`
    UPDATE pending_updates SET status = 'published', reviewed_at = datetime('now'), reviewed_by = ?
    WHERE id = ?
  `).run(req.user.email, req.params.id);

  res.json({ message: '已批准并发布', publishedId });
});

/**
 * POST /api/pending/:id/reject - 拒绝
 */
router.post('/:id/reject', requireAdmin, (req, res) => {
  const { notes } = req.body;
  const item = db.prepare('SELECT * FROM pending_updates WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '条目不存在' });
  if (item.status !== 'pending') return res.status(400).json({ error: '该条目已处理' });

  db.prepare(`
    UPDATE pending_updates SET status = 'rejected', reviewed_at = datetime('now'), reviewed_by = ?, reviewer_notes = ?
    WHERE id = ?
  `).run(req.user.email, notes || null, req.params.id);

  res.json({ message: '已拒绝' });
});

/**
 * POST /api/pending/:id/approve-edit - 编辑后批准
 * 接收修改后的内容，更新 pending 记录后再发布
 */
router.post('/:id/approve-edit', requireAdmin, (req, res) => {
  const { title, summary, content, category } = req.body;
  const item = db.prepare('SELECT * FROM pending_updates WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '条目不存在' });
  if (item.status !== 'pending') return res.status(400).json({ error: '该条目已处理' });

  let contentObj = {};
  try { contentObj = JSON.parse(item.content); } catch (e) {}

  const finalTitle = title || item.title;
  const finalSummary = summary || item.summary;
  if (category) contentObj.category = category;
  if (content) contentObj.content = content;
  const finalContent = JSON.stringify(contentObj);

  let publishedId = null;

  if (item.agent_type === 'question') {
    publishedId = insertQuestionFromPending(item);
  } else if (item.agent_type === 'news') {
    const result = db.prepare(`
      INSERT INTO news (category, title, summary, content, source, source_url, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      contentObj.category || 'research',
      finalTitle,
      finalSummary,
      contentObj.content || finalSummary,
      item.source || contentObj.source || '',
      item.source_url || '',
      contentObj.published_at || new Date().toISOString()
    );
    publishedId = result.lastInsertRowid;
  }

  // 更新 pending 状态
  db.prepare(`
    UPDATE pending_updates SET status = 'published', title = ?, summary = ?, content = ?,
    reviewed_at = datetime('now'), reviewed_by = ?
    WHERE id = ?
  `).run(finalTitle, finalSummary, finalContent, req.user.email, req.params.id);

  res.json({ message: '已编辑并发布', publishedId });
});

/**
 * DELETE /api/pending/:id - 删除
 */
router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM pending_updates WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '条目不存在' });
  res.json({ message: '已删除' });
});

module.exports = router;
