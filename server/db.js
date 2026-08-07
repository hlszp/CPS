/**
 * 数据库初始化与连接
 * 使用 better-sqlite3 (同步 SQLite，高性能)
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'cps.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 开启 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * 初始化所有表结构
 */
function initSchema() {
  db.exec(`
    -- ================================================================
    -- 用户表（SaaS 基础）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name        TEXT NOT NULL,
      role        TEXT DEFAULT 'user' CHECK(role IN ('user','editor','admin')),
      avatar      TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    -- ================================================================
    -- 课程表（理论 + 实务，content 存 JSON）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS courses (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,           -- 'theory' | 'practice'
      title       TEXT NOT NULL,
      tag         TEXT,
      color       TEXT,
      icon        TEXT,
      description TEXT,
      content     TEXT,                    -- JSON: chapters[]
      sort_order  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    -- ================================================================
    -- 题库表（模拟测试）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS questions (
      id          TEXT PRIMARY KEY,
      category    TEXT NOT NULL,           -- theory_single/multiple/judge, practice_single/multiple/case
      question    TEXT NOT NULL,
      options     TEXT,                    -- JSON array
      answer      TEXT NOT NULL,
      explanation TEXT,
      source      TEXT,
      difficulty  TEXT,
      weight      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    -- ================================================================
    -- 练习卡 - 主题表
    -- ================================================================
    CREATE TABLE IF NOT EXISTS practice_topics (
      id           TEXT PRIMARY KEY,       -- topicId, e.g. 'intro_01'
      course_id    TEXT NOT NULL,
      course_title TEXT,
      course_tag   TEXT,
      course_color TEXT,
      topic_title  TEXT NOT NULL,
      chapter      TEXT,
      sort_order   INTEGER DEFAULT 0,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    -- ================================================================
    -- 练习卡 - 题目表
    -- ================================================================
    CREATE TABLE IF NOT EXISTS practice_questions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id    TEXT NOT NULL,
      type        TEXT NOT NULL,           -- 'choice' | 'judge'
      question    TEXT NOT NULL,
      options     TEXT,                    -- JSON array
      answer      TEXT NOT NULL,
      explanation TEXT,
      source      TEXT,
      sort_order  INTEGER DEFAULT 0,
      FOREIGN KEY (topic_id) REFERENCES practice_topics(id) ON DELETE CASCADE
    );

    -- ================================================================
    -- 知识图谱（整体存 JSON）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS knowledge_graph (
      id   INTEGER PRIMARY KEY CHECK(id = 1),
      data TEXT NOT NULL                   -- JSON: {nodes:[], edges:[]}
    );

    -- ================================================================
    -- 资讯表
    -- ================================================================
    CREATE TABLE IF NOT EXISTS news (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      category     TEXT NOT NULL,          -- 'exam','career','research','resource'
      title        TEXT NOT NULL,
      summary      TEXT,
      content      TEXT,
      source       TEXT,
      source_url   TEXT,
      sort_order   INTEGER DEFAULT 0,
      published_at TEXT,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    -- ================================================================
    -- 用户学习进度（SaaS 扩展）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS user_progress (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      type       TEXT NOT NULL,            -- 'quiz','practice','course'
      ref_id     TEXT,
      data       TEXT,                     -- JSON
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ================================================================
    -- 用户测试记录（SaaS 扩展）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS user_quiz_results (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      exam_type  TEXT,
      score      INTEGER,
      total      INTEGER,
      details    TEXT,                     -- JSON
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ================================================================
    -- AI Agent 待审核内容队列
    -- ================================================================
    CREATE TABLE IF NOT EXISTS pending_updates (
      id            TEXT PRIMARY KEY,       -- UUID
      agent_type    TEXT NOT NULL,          -- 'news' | 'question' | 'knowledge'
      title         TEXT NOT NULL,
      summary       TEXT,
      content       TEXT,                   -- JSON: 结构化内容（news字段、question字段等）
      source        TEXT,                   -- 来源名称
      source_url    TEXT,                   -- 来源链接
      ai_confidence REAL DEFAULT 0.5,       -- AI 置信度 0-1
      status        TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','published')),
      reviewer_notes TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      reviewed_at   TEXT,
      reviewed_by   TEXT                    -- 审核人 email
    );

    -- ================================================================
    -- 每日一练题集（按日期生成，全局一套；完成度用 user_progress 记录）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS daily_practice (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      practice_date TEXT NOT NULL UNIQUE,   -- YYYY-MM-DD
      question_ids  TEXT NOT NULL,          -- JSON array of question ids
      course_ids    TEXT,                   -- JSON array（选题范围，可空=全库）
      count         INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_daily_practice_date ON daily_practice(practice_date);

    -- ================================================================
    -- 定时任务调度配置（node-cron）
    -- ================================================================
    CREATE TABLE IF NOT EXISTS schedules (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      agent_type   TEXT NOT NULL,           -- 'news' | 'literature' | 'question'
      cron         TEXT NOT NULL,           -- cron 表达式，如 '0 8 * * *'
      enabled      INTEGER DEFAULT 1,
      last_run_at  TEXT,
      last_status  TEXT,                     -- 'success' | 'failed' | 'running'
      note         TEXT,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    -- ================================================================
    -- AI Agent 执行记录
    -- ================================================================
    CREATE TABLE IF NOT EXISTS agent_runs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_type    TEXT NOT NULL,          -- 'news' | 'question' | 'knowledge'
      trigger       TEXT NOT NULL,          -- 'cron' | 'manual'
      status        TEXT NOT NULL,          -- 'running' | 'success' | 'failed'
      items_found   INTEGER DEFAULT 0,      -- 采集到的条目数
      items_saved   INTEGER DEFAULT 0,      -- 写入 pending 的条目数
      error         TEXT,
      started_at    TEXT DEFAULT (datetime('now')),
      finished_at   TEXT
    );
  `);
}

// 初始化
initSchema();

module.exports = db;
