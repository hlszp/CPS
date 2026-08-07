/**
 * 每日一练路由
 *
 * GET  /api/daily/today     - 获取当日题集（首次访问自动按权重生成并落库，全天稳定）
 * POST /api/daily/submit    - 提交作答，判分并返回解析
 * GET  /api/daily/streak    - 获取打卡连续天数（需登录）
 *
 * 设计：每日一练不依赖智能体，直接从已验证题库中按权重随机抽题，
 *      保证快速、免费、稳定；题集按日期唯一生成一套。
 */

const express = require('express');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const MIN_COUNT = 5;
const MAX_COUNT = 10;
const DEFAULT_COUNT = 8;

/**
 * 按权重随机抽样（不放回）
 */
function weightedSample(rows, n) {
  const pool = rows.map(r => ({ id: r.id, w: Math.max(1, r.weight || 1) }));
  const picked = [];
  const total = pool.reduce((s, x) => s + x.w, 0);
  let remaining = total;
  const available = [...pool];

  while (picked.length < n && available.length > 0) {
    let r = Math.random() * remaining;
    let idx = 0;
    for (; idx < available.length; idx++) {
      r -= available[idx].w;
      if (r <= 0) break;
    }
    if (idx >= available.length) idx = available.length - 1;
    picked.push(available[idx].id);
    remaining -= available[idx].w;
    available.splice(idx, 1);
  }
  return picked;
}

/**
 * 生成当日题集（若已存在则直接返回）
 */
function ensureTodaySet(courseIds) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const existing = db.prepare('SELECT * FROM daily_practice WHERE practice_date = ?').get(today);
  if (existing) {
    let ids = [];
    try { ids = JSON.parse(existing.question_ids); } catch (e) {}
    return { date: today, ids, count: existing.count };
  }

  // 题库为空则无法生成
  const total = db.prepare('SELECT COUNT(*) as c FROM questions').get().c;
  if (total === 0) {
    return { date: today, ids: [], count: 0, empty: true };
  }

  // 选题范围
  let rows;
  if (courseIds && courseIds.length > 0) {
    // 按课程关联：题库 source 含课程名，或扩展字段。这里退化为全库加权（题库未强关联 course_id）
    rows = db.prepare('SELECT id, weight FROM questions').all();
  } else {
    rows = db.prepare('SELECT id, weight FROM questions').all();
  }

  const n = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(total * 0.04)));
  const chosen = weightedSample(rows, n);

  db.prepare(`
    INSERT OR REPLACE INTO daily_practice (practice_date, question_ids, course_ids, count)
    VALUES (?, ?, ?, ?)
  `).run(today, JSON.stringify(chosen), courseIds ? JSON.stringify(courseIds) : null, chosen.length);

  return { date: today, ids: chosen, count: chosen.length };
}

/**
 * GET /api/daily/today
 */
router.get('/today', (req, res) => {
  try {
    const courseIds = req.query.course ? String(req.query.course).split(',').filter(Boolean) : null;
    const set = ensureTodaySet(courseIds);

    if (set.empty) {
      return res.json({ date: set.date, questions: [], count: 0, empty: true });
    }

    // 取题目详情（不返回答案与解析，提交后再返回）
    const placeholders = set.ids.map(() => '?').join(',');
    const questions = db.prepare(`
      SELECT id, category, question, options, source, difficulty, weight
      FROM questions WHERE id IN (${placeholders})
    `).all(...set.ids);

    // 保持题集顺序
    const byId = {};
    questions.forEach(q => {
      if (q.options) { try { q.options = JSON.parse(q.options); } catch (e) { q.options = []; } }
      byId[q.id] = q;
    });
    const ordered = set.ids.map(id => byId[id]).filter(Boolean);

    res.json({ date: set.date, questions: ordered, count: ordered.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/daily/submit
 * body: { date, answers: { [questionId]: 'B' } }
 */
router.post('/submit', optionalAuth, (req, res) => {
  try {
    const { date, answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers 为必填对象' });
    }

    const ids = Object.keys(answers);
    if (ids.length === 0) return res.status(400).json({ error: '未提交任何答案' });

    const placeholders = ids.map(() => '?').join(',');
    const questions = db.prepare(`
      SELECT id, category, question, options, answer, explanation, source, difficulty
      FROM questions WHERE id IN (${placeholders})
    `).all(...ids);

    let correct = 0;
    const results = questions.map(q => {
      const userAns = answers[q.id];
      const isCorrect = String(userAns).trim().toUpperCase() === String(q.answer).trim().toUpperCase();
      if (isCorrect) correct++;
      let options = [];
      try { options = q.options ? JSON.parse(q.options) : []; } catch (e) {}
      return {
        id: q.id,
        question: q.question,
        options,
        userAnswer: userAns,
        correctAnswer: q.answer,
        isCorrect,
        explanation: q.explanation,
        source: q.source
      };
    });

    const score = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

    // 记录打卡（若已登录）
    if (req.user) {
      const already = db.prepare(
        "SELECT id FROM user_progress WHERE user_id = ? AND type = 'daily' AND ref_id = ?"
      ).get(req.user.id, date || new Date().toISOString().slice(0, 10));
      if (!already) {
        db.prepare(`
          INSERT INTO user_progress (user_id, type, ref_id, data)
          VALUES (?, 'daily', ?, ?)
        `).run(req.user.id, date || new Date().toISOString().slice(0, 10),
          JSON.stringify({ score, correct, total: results.length, answeredAt: new Date().toISOString() }));
      }
    }

    res.json({ score, correct, total: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/daily/streak - 连续打卡天数
 */
router.get('/streak', optionalAuth, (req, res) => {
  if (!req.user) return res.json({ streak: 0, days: 0, loggedIn: false });
  const rows = db.prepare(`
    SELECT ref_id FROM user_progress WHERE user_id = ? AND type = 'daily' ORDER BY ref_id DESC
  `).all(req.user.id);
  const dates = new Set(rows.map(r => r.ref_id));
  let streak = 0;
  const d = new Date();
  // 从今天往前数
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) streak++;
    else if (i > 0) break; // 今天没做但昨天做了，不算断；从昨天开始断
    d.setDate(d.getDate() - 1);
  }
  res.json({ streak, days: dates.size, loggedIn: true });
});

module.exports = router;
