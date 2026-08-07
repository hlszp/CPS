/**
 * 统计聚合路由 - 所有计数来自真实数据库
 * GET /api/stats
 *   公开字段：courses / theoryCourses / practiceCourses / questions /
 *            practiceQuestions / knowledgeNodes / knowledgeEdges /
 *            news / dailyPractice
 *   管理员态（携带有效 admin/editor token）额外返回：users / pendingUpdates
 */
const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function cnt(sql) {
  try {
    return db.prepare(sql).get().c;
  } catch (e) {
    return 0;
  }
}

router.get('/', optionalAuth, (req, res) => {
  const theoryCourses = cnt("SELECT COUNT(*) c FROM courses WHERE type='theory'");
  const practiceCourses = cnt("SELECT COUNT(*) c FROM courses WHERE type='practice'");
  const questions = cnt('SELECT COUNT(*) c FROM questions');
  const practiceQuestions = cnt('SELECT COUNT(*) c FROM practice_questions');
  const news = cnt('SELECT COUNT(*) c FROM news');
  const dailyPractice = cnt('SELECT COUNT(*) c FROM daily_practice');

  let knowledgeNodes = 0;
  let knowledgeEdges = 0;
  try {
    const row = db.prepare('SELECT data FROM knowledge_graph WHERE id=1').get();
    if (row && row.data) {
      const g = JSON.parse(row.data);
      knowledgeNodes = (g.nodes || []).length;
      knowledgeEdges = (g.edges || []).length;
    }
  } catch (e) { /* ignore */ }

  const result = {
    courses: theoryCourses + practiceCourses,
    theoryCourses,
    practiceCourses,
    questions,
    practiceQuestions,
    knowledgeNodes,
    knowledgeEdges,
    news,
    dailyPractice,
    generatedAt: new Date().toISOString()
  };

  // 管理员态：额外返回用户数与待审核数
  if (req.user && (req.user.role === 'admin' || req.user.role === 'editor')) {
    result.users = cnt('SELECT COUNT(*) c FROM users');
    result.pendingUpdates = cnt("SELECT COUNT(*) c FROM pending_updates WHERE status='pending'");
  }

  res.json(result);
});

module.exports = router;
