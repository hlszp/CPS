/**
 * 资讯路由 - CRUD
 */
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { classifyContent } = require('../agents/news-agent');

const router = express.Router();

/**
 * GET /api/news - 获取资讯列表
 * ?category=exam|career|research|resource
 */
router.get('/', (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT * FROM news';
  const params = [];
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  sql += ' ORDER BY sort_order ASC, id ASC';
  const items = db.prepare(sql).all(...params);
  res.json({ news: items });
});

/**
 * GET /api/news/:id - 获取单条资讯
 */
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '资讯不存在' });
  res.json({ news: item });
});

/**
 * POST /api/news - 创建资讯（管理员）
 */
router.post('/', requireAdmin, (req, res) => {
  const { category, title, summary, content, source, source_url, sort_order, published_at } = req.body;
  if (!category || !title) {
    return res.status(400).json({ error: 'category, title 为必填' });
  }
  const result = db.prepare(`
    INSERT INTO news (category, title, summary, content, source, source_url, sort_order, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category, title, summary || null, content || null, source || null,
    source_url || null, sort_order || 0, published_at || null);
  res.status(201).json({ message: '资讯创建成功', id: result.lastInsertRowid });
});

/**
 * PUT /api/news/:id - 更新资讯（管理员）
 */
router.put('/:id', requireAdmin, (req, res) => {
  const { category, title, summary, content, source, source_url, sort_order, published_at } = req.body;
  const updates = [];
  const params = [];

  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (summary !== undefined) { updates.push('summary = ?'); params.push(summary); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (source !== undefined) { updates.push('source = ?'); params.push(source); }
  if (source_url !== undefined) { updates.push('source_url = ?'); params.push(source_url); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
  if (published_at !== undefined) { updates.push('published_at = ?'); params.push(published_at); }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  const result = db.prepare(`UPDATE news SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  if (result.changes === 0) return res.status(404).json({ error: '资讯不存在' });
  res.json({ message: '更新成功' });
});

/**
 * DELETE /api/news/:id - 删除资讯（管理员）
 */
router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '资讯不存在' });
  res.json({ message: '删除成功' });
});

/**
 * PUT /api/news/batch-category - 批量修改已发布资讯的分类（管理员）
 * body: { ids: [1,2,3], category: 'exam' }
 */
router.put('/batch-category', requireAdmin, (req, res) => {
  const { ids, category } = req.body;
  const allowed = ['exam', 'career', 'research', 'resource'];
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供资讯 ID 列表' });
  }
  if (!allowed.includes(category)) {
    return res.status(400).json({ error: '非法的分类值' });
  }
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(
    `UPDATE news SET category = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`
  ).run(category, ...ids);
  res.json({ message: `已更新 ${result.changes} 条资讯的分类为「${category}」`, updated: result.changes });
});

/**
 * POST /api/news/reclassify - AI 智能重分类（管理员）
 * 对指定资讯逐条调用 LLM 重新判定分类并更新
 * body: { ids: [1,2,3] } 或省略 ids 表示对所有 research 资讯重分类
 */
router.post('/reclassify', requireAdmin, async (req, res) => {
  const { ids } = req.body || {};
  let items;
  if (Array.isArray(ids) && ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    items = db.prepare(`SELECT * FROM news WHERE id IN (${placeholders})`).all(...ids);
  } else {
    items = db.prepare("SELECT * FROM news WHERE category = 'research'").all();
  }

  if (items.length === 0) return res.json({ message: '没有需要重分类的资讯', updated: 0 });

  let updated = 0;
  const updateStmt = db.prepare("UPDATE news SET category = ?, updated_at = datetime('now') WHERE id = ?");
  for (const item of items) {
    try {
      const cat = await classifyContent(item.title, item.summary || item.content || '');
      if (cat && cat !== item.category) {
        updateStmt.run(cat, item.id);
        updated++;
      }
    } catch (e) {
      console.error(`[News] 重分类失败 id=${item.id}:`, e.message);
    }
  }
  res.json({ message: `AI 重分类完成，共调整 ${updated} 条`, updated, total: items.length });
});

module.exports = router;
