/**
 * 定时调度器（node-cron）
 *
 * 在 Express 进程内运行，按 schedules 表中配置的周期自动触发智能体任务：
 *   - news（新闻采集）：默认每天 08:00
 *   - literature（文献采集）：默认每周一 09:00
 *   - question（出题）：默认关闭（出题一般手动触发，亦可开启）
 *
 * 通过 CMS 面板（/api/schedules）可开关、改周期、立即执行。
 */

const db = require('./db');
const cron = require('node-cron');
const newsAgent = require('./agents/news-agent');
const questionAgent = require('./agents/question-agent');

const TIMEZONE = 'Asia/Shanghai';

// 默认调度配置（首次启动写入，之后以表内配置为准）
const DEFAULT_SCHEDULES = [
  { id: 'news',       name: '新闻采集',   agent_type: 'news',       cron: '0 8 * * *',  enabled: 1, note: '每天 08:00 采集心理学新闻资讯' },
  { id: 'literature', name: '文献采集',   agent_type: 'literature', cron: '0 9 * * 1',  enabled: 1, note: '每周一 09:00 采集学术文献' },
  { id: 'question',   name: '智能出题',   agent_type: 'question',   cron: '0 10 * * 1', enabled: 0, note: '每周一 10:00 基于全课程自动出题（默认关闭）' }
];

const tasks = new Map(); // id -> cron.Task

/**
 * 首次启动时写入默认调度（已存在则跳过）
 */
function ensureDefaultSchedules() {
  for (const s of DEFAULT_SCHEDULES) {
    const exist = db.prepare('SELECT id FROM schedules WHERE id = ?').get(s.id);
    if (!exist) {
      db.prepare(`
        INSERT INTO schedules (id, name, agent_type, cron, enabled, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(s.id, s.name, s.agent_type, s.cron, s.enabled, s.note);
    }
  }
}

/**
 * 执行某个调度对应的智能体任务
 */
async function executeSchedule(schedule) {
  db.prepare(`UPDATE schedules SET last_run_at = datetime('now'), last_status = 'running' WHERE id = ?`).run(schedule.id);
  console.log(`[Scheduler] 触发任务: ${schedule.name} (${schedule.agent_type})`);
  try {
    if (schedule.agent_type === 'news') {
      await newsAgent.run('cron', 'news');
    } else if (schedule.agent_type === 'literature') {
      await newsAgent.run('cron', 'literature');
    } else if (schedule.agent_type === 'question') {
      await questionAgent.run({ count: 8, mode: 'course' }, 'cron');
    }
    db.prepare(`UPDATE schedules SET last_status = 'success' WHERE id = ?`).run(schedule.id);
    console.log(`[Scheduler] 任务完成: ${schedule.name}`);
  } catch (e) {
    db.prepare(`UPDATE schedules SET last_status = 'failed' WHERE id = ?`).run(schedule.id);
    console.error(`[Scheduler] 任务失败: ${schedule.name} -`, e.message);
  }
}

/**
 * 校验 cron 表达式
 */
function isValidCron(expr) {
  return cron.validate(expr);
}

/**
 * 注册单个调度任务
 */
function registerSchedule(schedule) {
  if (tasks.has(schedule.id)) {
    tasks.get(schedule.id).stop();
    tasks.delete(schedule.id);
  }
  if (!schedule.enabled) return;
  if (!isValidCron(schedule.cron)) {
    console.warn(`[Scheduler] 无效 cron 表达式，跳过: ${schedule.id} -> ${schedule.cron}`);
    return;
  }
  const task = cron.schedule(schedule.cron, () => {
    executeSchedule(schedule);
  }, { timezone: TIMEZONE });
  tasks.set(schedule.id, task);
  console.log(`[Scheduler] 已注册: ${schedule.name} (${schedule.cron})`);
}

/**
 * 启动调度器
 */
function startScheduler() {
  ensureDefaultSchedules();
  const all = db.prepare('SELECT * FROM schedules').all();
  all.forEach(registerSchedule);
  console.log(`[Scheduler] 共注册 ${tasks.size} 个定时任务`);
}

/**
 * 重新加载（配置变更后调用）
 */
function reloadSchedules() {
  const all = db.prepare('SELECT * FROM schedules').all();
  all.forEach(registerSchedule);
}

/**
 * 立即执行某个调度（CMS "立即执行"）
 */
async function runNow(id) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
  if (!schedule) throw new Error('调度不存在: ' + id);
  await executeSchedule(schedule);
}

module.exports = { startScheduler, reloadSchedules, runNow, isValidCron, ensureDefaultSchedules };
