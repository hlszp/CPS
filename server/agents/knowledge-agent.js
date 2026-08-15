/**
 * 知识图谱更新 Agent
 *
 * 工作流程（手动触发 / 定时触发）：
 * 1. 从 knowledge_graph 表读取现有骨架图谱
 * 2. 剥离上一次生成的内容层(_layer='content')与 LLM 补充层(_layer='llm')
 * 3. 聚合层：统计 DB 中的新闻(4类) / 自测题(theory|practice) / 练习题(按14门课)，
 *    生成内容层节点 + 边，挂入图谱
 * 4. LLM 补充层：基于 14 门课程，用 LLM 提取可能遗漏的重要知识点/易考点，补充到对应课程下
 * 5. 将合并后的图谱写回 knowledge_graph 表
 *
 * 边格式约定：{ from, to, type:'parent'|'related' }（前端 convertData 会转成 G6 的 source/target）
 * 内容层/LLM 层节点带 _layer 标记，便于下次触发时剥离重建。
 *
 * 触发方式：cron 定时 / 后台手动触发
 */

const db = require('../db');
const { chatJSON, getConfig } = require('./llm');

// 内容层标记字段（不进入图谱语义，仅用于剥离）
const LAYER = '_layer';

// 资讯分类元信息
const NEWS_CATEGORIES = [
  { key: 'exam',     label: '考试动态' },
  { key: 'career',   label: '职业展望' },
  { key: 'research', label: '学术前沿' },
  { key: 'resource', label: '权威资源' }
];

/**
 * 剥离上一次生成的内容层 / LLM 层，保留静态骨架
 */
function stripGenerated(graph) {
  graph.nodes = (graph.nodes || []).filter(function (n) {
    return n[LAYER] !== 'content' && n[LAYER] !== 'llm';
  });
  graph.edges = (graph.edges || []).filter(function (e) {
    return e[LAYER] !== 'content' && e[LAYER] !== 'llm';
  });
  return graph;
}

/**
 * 取骨架节点坐标，用于给动态节点算初始位置（避免重叠）
 */
function nodeXY(graph, id) {
  const n = (graph.nodes || []).find(function (x) { return x.id === id; });
  return n ? { x: n.x || 0, y: n.y || 0 } : { x: 600, y: 400 };
}

function count(sql, param) {
  const row = param !== undefined
    ? db.prepare(sql).get(param)
    : db.prepare(sql).get();
  return row ? row.c : 0;
}

/**
 * 聚合层：新闻 / 自测题 / 练习题
 */
function buildContentLayer(graph) {
  const nodes = [];
  const edges = [];

  // --- 新闻：资讯中心根 + 4 分类节点 ---
  nodes.push({
    id: 'news_root', label: '资讯动态', type: 'root', level: 0,
    x: 1080, y: 40, desc: '智能体采集的心理学资讯，按分类聚合统计', [LAYER]: 'content'
  });
  NEWS_CATEGORIES.forEach(function (c, i) {
    const cnt = count('SELECT COUNT(*) AS c FROM news WHERE category = ?', c.key);
    const id = 'news_' + c.key;
    const p = nodeXY(graph, 'news_root');
    nodes.push({
      id: id, label: c.label + ' (' + cnt + ')', type: 'content', level: 1,
      x: p.x - 210 + i * 140, y: p.y + 100,
      desc: c.label + '：当前 ' + cnt + ' 篇资讯', count: cnt,
      parent: 'news_root', [LAYER]: 'content'
    });
    edges.push({ from: 'news_root', to: id, type: 'parent', [LAYER]: 'content' });
  });

  // --- 自测题：理论 / 实务 ---
  ['theory', 'practice'].forEach(function (rootId) {
    const cnt = count("SELECT COUNT(*) AS c FROM questions WHERE category LIKE ?", rootId + '_%');
    if (cnt > 0) {
      const id = 'quiz_' + rootId;
      const p = nodeXY(graph, rootId);
      nodes.push({
        id: id, label: (rootId === 'theory' ? '理论' : '实务') + '自测题 (' + cnt + ')',
        type: 'content', level: 1, x: p.x, y: p.y + 120,
        desc: '自测题库：' + cnt + ' 题', count: cnt,
        parent: rootId, [LAYER]: 'content'
      });
      edges.push({ from: rootId, to: id, type: 'related', label: '含题库', [LAYER]: 'content' });
    }
  });

  // --- 练习题：按 14 门课 ---
  const courseRows = db.prepare('SELECT id, title FROM courses').all();
  courseRows.forEach(function (course, idx) {
    const cnt = count(`
      SELECT COUNT(*) AS c FROM practice_questions pq
      JOIN practice_topics pt ON pq.topic_id = pt.id
      WHERE pt.course_id = ?
    `, course.id);
    if (cnt > 0) {
      const id = 'practice_' + course.id;
      const p = nodeXY(graph, course.id);
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      nodes.push({
        id: id, label: '练习题 (' + cnt + ')', type: 'content', level: 3,
        x: (p.x || 100) + 50 + col * 36, y: (p.y || 100) + 70 + row * 36,
        desc: course.title + ' 配套练习题：' + cnt + ' 题', count: cnt,
        parent: course.id, [LAYER]: 'content'
      });
      edges.push({ from: course.id, to: id, type: 'parent', [LAYER]: 'content' });
    }
  });

  return { nodes: nodes, edges: edges };
}

/**
 * LLM 补充层：基于 14 门课程补充遗漏知识点（容错，失败则跳过）
 */
async function buildLLMSupplements(graph) {
  const cfg = getConfig();
  if (!cfg || !cfg.apiKey) {
    console.log('[KnowledgeAgent] 未配置 LLM，跳过骨架补充');
    return { nodes: [], edges: [] };
  }

  const courses = db.prepare('SELECT id, title FROM courses').all();
  if (!courses.length) return { nodes: [], edges: [] };

  const courseList = courses.map(function (c) { return '- ' + c.id + ': ' + c.title; }).join('\n');
  const prompt =
    '你是心理咨询师考试资深培训专家。现有以下 ' + courses.length + ' 门课程：\n' +
    courseList + '\n\n' +
    '请为每门课程补充 1-2 个"知识图谱中可能遗漏的重要知识点或高频易考点"（detail 级别）。\n' +
    '只返回 JSON 数组，不要代码块、不要解释，格式严格为：\n' +
    '[{"courseId":"intro","label":"知识点名称","desc":"一句话说明"}]\n' +
    'courseId 必须严格取自上面的课程 id 列表。最多 ' + (courses.length * 2) + ' 项。';

  try {
    const arr = await chatJSON([
      { role: 'system', content: '你是严谨的心理学考试命题专家，只输出符合格式的 JSON 数组。' },
      { role: 'user', content: prompt }
    ], { max_tokens: 2000, temperature: 0.3, timeout: 60000 });

    if (!Array.isArray(arr)) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    arr.slice(0, courses.length * 2).forEach(function (item, i) {
      if (!item || !item.courseId || !item.label) return;
      const exists = courses.find(function (c) { return c.id === item.courseId; });
      if (!exists) return;
      const id = 'llm_' + item.courseId + '_' + i;
      const p = nodeXY(graph, item.courseId);
      nodes.push({
        id: id, label: item.label, type: 'detail', level: 3,
        x: (p.x || 100) + 70 + (i % 4) * 34, y: (p.y || 100) + 90 + Math.floor(i / 4) * 34,
        desc: item.desc || '', parent: item.courseId,
        [LAYER]: 'llm', _llm: true
      });
      edges.push({ from: item.courseId, to: id, type: 'parent', [LAYER]: 'llm' });
    });
    return { nodes: nodes, edges: edges };
  } catch (e) {
    console.error('[KnowledgeAgent] LLM 补充失败，跳过:', e.message);
    return { nodes: [], edges: [] };
  }
}

/**
 * 主入口
 */
async function run(trigger) {
  trigger = trigger || 'manual';
  const runInfo = db.prepare(
    "INSERT INTO agent_runs (agent_type, trigger, status, started_at) VALUES ('knowledge', ?, 'running', datetime('now'))"
  ).run(trigger);
  const runId = runInfo.lastInsertRowid;

  try {
    const row = db.prepare('SELECT data FROM knowledge_graph WHERE id = 1').get();
    let graph = row ? JSON.parse(row.data) : { nodes: [], edges: [] };
    if (!graph.nodes) graph.nodes = [];
    if (!graph.edges) graph.edges = [];

    // 1. 剥离上次生成的内容层 / LLM 层
    graph = stripGenerated(graph);

    // 2. 聚合内容层
    const content = buildContentLayer(graph);
    graph.nodes = graph.nodes.concat(content.nodes);
    graph.edges = graph.edges.concat(content.edges);

    // 3. LLM 补充骨架
    const llm = await buildLLMSupplements(graph);
    graph.nodes = graph.nodes.concat(llm.nodes);
    graph.edges = graph.edges.concat(llm.edges);

    // 4. 写回 knowledge_graph 表
    db.prepare('INSERT OR REPLACE INTO knowledge_graph (id, data) VALUES (1, ?)')
      .run(JSON.stringify(graph));

    const total = content.nodes.length + llm.nodes.length;
    db.prepare(
      "UPDATE agent_runs SET status='success', items_found=?, items_saved=?, finished_at=datetime('now') WHERE id=?"
    ).run(total, total, runId);

    console.log('[KnowledgeAgent] 知识图谱更新完成，新增/刷新节点 ' + total +
      '（内容层 ' + content.nodes.length + '，LLM 补充 ' + llm.nodes.length + '）');
  } catch (e) {
    console.error('[KnowledgeAgent] 更新失败:', e.message);
    db.prepare(
      "UPDATE agent_runs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?"
    ).run(String(e.message || e), runId);
  }
}

module.exports = { run };
