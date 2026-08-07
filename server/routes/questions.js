/**
 * 题库路由 - CRUD（模拟测试题库）
 */
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/questions - 获取题目列表
 * ?category=theory_single&limit=50&offset=0
 * ?all=true (管理员可看全部)
 */
router.get('/', (req, res) => {
  const { category, all } = req.query;
  let sql = 'SELECT * FROM questions';
  const params = [];
  const conditions = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY id ASC';

  if (!all || all !== 'true') {
    const limit = parseInt(req.query.limit) || 500;
    const offset = parseInt(req.query.offset) || 0;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  const questions = db.prepare(sql).all(...params);

  // 解析 JSON 字段
  questions.forEach(q => {
    if (q.options) {
      try { q.options = JSON.parse(q.options); } catch (e) { q.options = []; }
    }
  });

  res.json({ questions, count: questions.length });
});

/**
 * GET /api/questions/stats - 题库统计
 */
router.get('/stats/summary', (req, res) => {
  const stats = db.prepare(`
    SELECT category, COUNT(*) as count FROM questions GROUP BY category
  `).all();
  const weightStats = db.prepare(`
    SELECT weight, COUNT(*) as count FROM questions GROUP BY weight
  `).all();
  res.json({ byCategory: stats, byWeight: weightStats });
});

/**
 * GET /api/questions/:id - 获取单题
 */
router.get('/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({ error: '题目不存在' });
  if (q.options) {
    try { q.options = JSON.parse(q.options); } catch (e) { q.options = []; }
  }
  res.json({ question: q });
});

/**
 * POST /api/questions - 创建题目（管理员）
 */
router.post('/', requireAdmin, (req, res) => {
  const { id, category, question, options, answer, explanation, source, difficulty, weight } = req.body;
  if (!id || !category || !question || !answer) {
    return res.status(400).json({ error: 'id, category, question, answer 为必填' });
  }
  db.prepare(`
    INSERT INTO questions (id, category, question, options, answer, explanation, source, difficulty, weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, category, question, options ? JSON.stringify(options) : null, answer,
    explanation || null, source || null, difficulty || null, weight || 1);
  res.status(201).json({ message: '题目创建成功', id });
});

/**
 * POST /api/questions/batch - 批量导入（管理员）
 */
router.post('/batch', requireAdmin, (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'questions 必须是数组' });
  }
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO questions (id, category, question, options, answer, explanation, source, difficulty, weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items) => {
    items.forEach(q => {
      stmt.run(q.id, q.category, q.question,
        q.options ? JSON.stringify(q.options) : null,
        q.answer, q.explanation || null, q.source || null,
        q.difficulty || null, q.weight || 1);
    });
  });
  tx(questions);
  res.json({ message: `成功导入 ${questions.length} 道题目` });
});

/**
 * PUT /api/questions/:id - 更新题目（管理员）
 */
router.put('/:id', requireAdmin, (req, res) => {
  const { question, options, answer, explanation, source, difficulty, weight, category } = req.body;
  const updates = [];
  const params = [];

  if (question !== undefined) { updates.push('question = ?'); params.push(question); }
  if (options !== undefined) { updates.push('options = ?'); params.push(JSON.stringify(options)); }
  if (answer !== undefined) { updates.push('answer = ?'); params.push(answer); }
  if (explanation !== undefined) { updates.push('explanation = ?'); params.push(explanation); }
  if (source !== undefined) { updates.push('source = ?'); params.push(source); }
  if (difficulty !== undefined) { updates.push('difficulty = ?'); params.push(difficulty); }
  if (weight !== undefined) { updates.push('weight = ?'); params.push(weight); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  const result = db.prepare(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' });
  res.json({ message: '更新成功' });
});

/**
 * DELETE /api/questions/:id - 删除题目（管理员）
 */
router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' });
  res.json({ message: '删除成功' });
});

module.exports = router;
