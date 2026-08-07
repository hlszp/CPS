/**
 * 知识图谱路由 - CRUD
 */
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/knowledge - 获取知识图谱（公开）
 */
router.get('/', (req, res) => {
  const row = db.prepare('SELECT data FROM knowledge_graph WHERE id = 1').get();
  if (!row) {
    return res.json({ graph: { nodes: [], edges: [] } });
  }
  try {
    const graph = JSON.parse(row.data);
    res.json({ graph });
  } catch (e) {
    res.json({ graph: { nodes: [], edges: [] } });
  }
});

/**
 * PUT /api/knowledge - 更新知识图谱（管理员）
 */
router.put('/', requireAdmin, (req, res) => {
  const { graph } = req.body;
  if (!graph || !graph.nodes || !graph.edges) {
    return res.status(400).json({ error: 'graph 必须包含 nodes 和 edges' });
  }
  db.prepare(`
    INSERT OR REPLACE INTO knowledge_graph (id, data) VALUES (1, ?)
  `).run(JSON.stringify(graph));
  res.json({ message: '知识图谱更新成功' });
});

/**
 * GET /api/knowledge/nodes - 获取所有节点
 */
router.get('/nodes', (req, res) => {
  const row = db.prepare('SELECT data FROM knowledge_graph WHERE id = 1').get();
  if (!row) return res.json({ nodes: [] });
  try {
    const graph = JSON.parse(row.data);
    res.json({ nodes: graph.nodes || [] });
  } catch (e) {
    res.json({ nodes: [] });
  }
});

module.exports = router;
