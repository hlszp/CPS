/**
 * 定时任务调度路由（CMS 管理）
 *
 * GET    /api/schedules            - 列表
 * PUT    /api/schedules/:id        - 更新（enabled / cron / note）
 * POST   /api/schedules/:id/run    - 立即执行一次
 */

const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const scheduler = require('../scheduler');

const router = express.Router();

/**
 * GET /api/schedules
 */
router.get('/', requireAdmin, (req, res) => {
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY id').all();
  res.json({ schedules });
});

/**
 * PUT /api/schedules/:id - 更新 enabled / cron / note
 */
router.put('/:id', requireAdmin, (req, res) => {
  const { enabled, cron, note } = req.body;
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ error: '调度不存在' });

  const updates = [];
  const params = [];

  if (enabled !== undefined) {
    updates.push('enabled = ?');
    params.push(enabled ? 1 : 0);
  }
  if (cron !== undefined) {
    if (!scheduler.isValidCron(cron)) {
      return res.status(400).json({ error: 'cron 表达式无效' });
    }
    updates.push('cron = ?');
    params.push(cron);
  }
  if (note !== undefined) {
    updates.push('note = ?');
    params.push(note);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: '无可更新字段' });
  }
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // 重新加载调度
  scheduler.reloadSchedules();

  res.json({ message: '调度已更新', schedule: db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id) });
});

/**
 * POST /api/schedules/:id/run - 立即执行
 */
router.post('/:id/run', requireAdmin, async (req, res) => {
  try {
    res.json({ message: '任务已触发（后台执行）', status: 'running' });
    scheduler.runNow(req.params.id).catch(e => {
      console.error('[Schedule Run] 失败:', e.message);
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
