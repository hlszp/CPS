/**
 * 课程路由 - CRUD（理论课 + 实务课）
 */
const express = require('express');
const db = require('../db');
const { requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/courses - 获取课程列表（公开）
 * ?type=theory|practice
 */
router.get('/', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT id, type, title, tag, color, icon, description, sort_order FROM courses';
  const params = [];
  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  sql += ' ORDER BY sort_order ASC, id ASC';
  const courses = db.prepare(sql).all(...params);
  res.json({ courses });
});

/**
 * GET /api/courses/:id - 获取单个课程详情（含 content JSON）
 */
router.get('/:id', (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }
  if (course.content) {
    try { course.content = JSON.parse(course.content); } catch (e) { course.content = []; }
  } else {
    course.content = [];
  }
  res.json({ course });
});

/**
 * POST /api/courses - 创建课程（管理员）
 */
router.post('/', requireAdmin, (req, res) => {
  const { id, type, title, tag, color, icon, description, content, sort_order } = req.body;
  if (!id || !type || !title) {
    return res.status(400).json({ error: 'id, type, title 为必填' });
  }
  db.prepare(`
    INSERT INTO courses (id, type, title, tag, color, icon, description, content, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, title, tag || null, color || null, icon || null, description || null,
    content ? JSON.stringify(content) : null, sort_order || 0);
  res.status(201).json({ message: '课程创建成功', id });
});

/**
 * PUT /api/courses/:id - 更新课程（管理员）
 */
router.put('/:id', requireAdmin, (req, res) => {
  const { title, tag, color, icon, description, content, sort_order } = req.body;
  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (tag !== undefined) { updates.push('tag = ?'); params.push(tag); }
  if (color !== undefined) { updates.push('color = ?'); params.push(color); }
  if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (content !== undefined) { updates.push('content = ?'); params.push(JSON.stringify(content)); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  const result = db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  if (result.changes === 0) {
    return res.status(404).json({ error: '课程不存在' });
  }
  res.json({ message: '更新成功' });
});

/**
 * DELETE /api/courses/:id - 删除课程（管理员）
 */
router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '课程不存在' });
  }
  res.json({ message: '删除成功' });
});

module.exports = router;
