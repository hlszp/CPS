/**
 * 练习卡路由 - CRUD（主题 + 题目）
 */
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/practice - 获取所有练习卡数据（公开）
 * 返回按课程分组的完整结构
 */
router.get('/', (req, res) => {
  const topics = db.prepare('SELECT * FROM practice_topics ORDER BY course_id, sort_order').all();

  // 按课程分组
  const courses = {};
  topics.forEach(t => {
    if (!courses[t.course_id]) {
      courses[t.course_id] = {
        courseId: t.course_id,
        courseTitle: t.course_title,
        courseTag: t.course_tag,
        courseColor: t.course_color,
        topics: []
      };
    }
    courses[t.course_id].topics.push({
      topicId: t.id,
      topicTitle: t.topic_title,
      chapter: t.chapter,
      questions: []
    });
  });

  // 加载所有题目并分配到对应主题
  const questions = db.prepare('SELECT * FROM practice_questions ORDER BY topic_id, sort_order').all();
  questions.forEach(q => {
    const course = Object.values(courses).find(c =>
      c.topics.some(t => t.topicId === q.topic_id)
    );
    if (course) {
      const topic = course.topics.find(t => t.topicId === q.topic_id);
      if (topic) {
        let options = q.options;
        try { options = JSON.parse(options); } catch (e) { options = []; }
        topic.questions.push({
          type: q.type,
          q: q.question,
          options,
          answer: q.answer,
          exp: q.explanation,
          src: q.source
        });
      }
    }
  });

  res.json({ courses: Object.values(courses) });
});

/**
 * GET /api/practice/topics - 获取所有主题列表
 */
router.get('/topics/list', (req, res) => {
  const topics = db.prepare('SELECT * FROM practice_topics ORDER BY course_id, sort_order').all();
  res.json({ topics });
});

/**
 * POST /api/practice/topic - 创建主题（管理员）
 */
router.post('/topic', requireAdmin, (req, res) => {
  const { topicId, courseId, courseTitle, courseTag, courseColor, topicTitle, chapter, sortOrder } = req.body;
  if (!topicId || !courseId || !topicTitle) {
    return res.status(400).json({ error: 'topicId, courseId, topicTitle 为必填' });
  }
  db.prepare(`
    INSERT INTO practice_topics (id, course_id, course_title, course_tag, course_color, topic_title, chapter, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(topicId, courseId, courseTitle || null, courseTag || null, courseColor || null,
    topicTitle, chapter || null, sortOrder || 0);
  res.status(201).json({ message: '主题创建成功', id: topicId });
});

/**
 * POST /api/practice/question - 创建练习题（管理员）
 */
router.post('/question', requireAdmin, (req, res) => {
  const { topicId, type, question, options, answer, explanation, source, sortOrder } = req.body;
  if (!topicId || !type || !question || !answer) {
    return res.status(400).json({ error: 'topicId, type, question, answer 为必填' });
  }
  const result = db.prepare(`
    INSERT INTO practice_questions (topic_id, type, question, options, answer, explanation, source, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(topicId, type, question, options ? JSON.stringify(options) : null,
    answer, explanation || null, source || null, sortOrder || 0);
  res.status(201).json({ message: '题目创建成功', id: result.lastInsertRowid });
});

/**
 * PUT /api/practice/topic/:id - 更新主题（管理员）
 */
router.put('/topic/:id', requireAdmin, (req, res) => {
  const { topicTitle, chapter, courseTitle, courseColor, sortOrder } = req.body;
  const updates = [];
  const params = [];
  if (topicTitle !== undefined) { updates.push('topic_title = ?'); params.push(topicTitle); }
  if (chapter !== undefined) { updates.push('chapter = ?'); params.push(chapter); }
  if (courseTitle !== undefined) { updates.push('course_title = ?'); params.push(courseTitle); }
  if (courseColor !== undefined) { updates.push('course_color = ?'); params.push(courseColor); }
  if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder); }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  const result = db.prepare(`UPDATE practice_topics SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  if (result.changes === 0) return res.status(404).json({ error: '主题不存在' });
  res.json({ message: '更新成功' });
});

/**
 * DELETE /api/practice/topic/:id - 删除主题（管理员，级联删除题目）
 */
router.delete('/topic/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM practice_topics WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '主题不存在' });
  res.json({ message: '删除成功' });
});

/**
 * DELETE /api/practice/question/:id - 删除练习题（管理员）
 */
router.delete('/question/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM practice_questions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' });
  res.json({ message: '删除成功' });
});

module.exports = router;
