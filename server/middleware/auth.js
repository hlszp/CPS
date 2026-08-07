/**
 * JWT 认证中间件
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cps-portal-secret-key-2026';
const JWT_EXPIRES = '7d';

/**
 * 生成 JWT token
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * 验证 token（可选认证：有 token 就解析，没有就跳过）
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // token 无效，但不阻止请求
    }
  }
  next();
}

/**
 * 强制认证（必须登录）
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

/**
 * 要求管理员权限
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  });
}

module.exports = { signToken, optionalAuth, requireAuth, requireAdmin, JWT_SECRET };
