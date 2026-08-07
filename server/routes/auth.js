/**
 * 认证路由 - 注册 / 登录 / 个人信息
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register - 用户注册
 */
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: '邮箱、密码、姓名均为必填' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }

  // 检查邮箱是否已注册
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: '该邮箱已注册' });
  }

  // 第一个注册的用户自动成为管理员
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const role = userCount === 0 ? 'admin' : 'user';

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email, passwordHash, name, role);

  const user = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ token, user });
});

/**
 * POST /api/auth/login - 用户登录
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码为必填' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    created_at: user.created_at
  };
  const token = signToken(safeUser);

  res.json({ token, user: safeUser });
});

/**
 * GET /api/auth/me - 获取当前用户信息
 */
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ user });
});

/**
 * PUT /api/auth/profile - 更新个人信息
 */
router.put('/profile', requireAuth, (req, res) => {
  const { name, avatar } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (avatar) { updates.push('avatar = ?'); params.push(avatar); }
  updates.push("updated_at = datetime('now')");
  params.push(req.user.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const user = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

/**
 * PUT /api/auth/password - 修改密码
 */
router.put('/password', requireAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(401).json({ error: '原密码错误' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user.id);
  res.json({ message: '密码修改成功' });
});

module.exports = router;
