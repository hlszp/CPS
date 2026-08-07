/**
 * CPS 三级心理咨询考试平台 - 后端服务器
 * Express + SQLite | CMS API + 用户认证
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const { optionalAuth } = require('./middleware/auth');

// 路由
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const questionRoutes = require('./routes/questions');
const practiceRoutes = require('./routes/practice');
const knowledgeRoutes = require('./routes/knowledge');
const newsRoutes = require('./routes/news');
const pendingRoutes = require('./routes/pending');
const agentRoutes = require('./routes/agent');
const dailyRoutes = require('./routes/daily');
const scheduleRoutes = require('./routes/schedules');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 安全：阻止通过 Web 访问 server 目录和敏感文件
app.use((req, res, next) => {
  if (req.path.startsWith('/server/') || req.path.includes('node_modules') ||
      req.path.match(/\.(env|sql|db)$/i)) {
    return res.status(403).send('Forbidden');
  }
  next();
});

// 静态文件 - 前端站点
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));

// 静态文件 - admin 后台
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pending', pendingRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA 回退 - 所有非 API、非静态文件请求返回 index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) {
    return next();
  }
  const indexPath = path.join(frontendDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

// 启动定时调度器（node-cron，在 Express 进程内运行）
try {
  const scheduler = require('./scheduler');
  scheduler.startScheduler();
} catch (e) {
  console.error('[Scheduler] 启动失败:', e.message);
}

// 启动
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  CPS 三级考试平台后端已启动`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api`);
  console.log(`  后台: http://localhost:${PORT}/admin`);
  console.log(`========================================\n`);
});
