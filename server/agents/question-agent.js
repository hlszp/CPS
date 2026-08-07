/**
 * 出题智能体（Question Agent）
 *
 * 功能：根据「课程教材内容」或「外部培训资源」自动生成备考题目，
 *       每条题目强制携带可溯源的 source（教材章节 或 外部 URL），
 *       写入 pending_updates 队列（agent_type='question'）等待人工审核。
 *
 * 两种模式：
 *   - mode='course'   : 基于 DB 中已有课程章节内容出题（最可信、可溯源）
 *   - mode='external' : 基于用户提供的文本或 URL（外部教程/文献）出题
 *
 * 触发方式：CMS 手动触发（POST /api/agent/trigger/questions）
 */

const db = require('../db');
const { chat, chatJSON, getConfig } = require('./llm');
const crypto = require('crypto');

// 考试题型（与 questions 表 category 字段保持一致）
const CATEGORIES = {
  theory: ['theory_single', 'theory_multiple', 'theory_judge'],
  practice: ['practice_single', 'practice_multiple', 'practice_case']
};

function genId() {
  return 'pq_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

/**
 * 抓取外部 URL 正文（去除标签，截取前 N 字）
 */
async function fetchUrlText(url, timeout = 20000, maxLen = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const clean = text.replace(/<script[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
    return clean.slice(0, maxLen);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 抽取课程章节文本（用于 course 模式出题）
 * @param {string|null} courseId - 指定课程；null 表示全部课程
 * @returns {Array<{title, text}>}
 */
function extractCourseText(courseId) {
  let courses;
  if (courseId) {
    const row = db.prepare('SELECT id, title, content FROM courses WHERE id = ?').get(courseId);
    courses = row ? [row] : [];
  } else {
    courses = db.prepare('SELECT id, title, content FROM courses ORDER BY sort_order').all();
  }

  const result = [];
  for (const c of courses) {
    let content = {};
    try { content = JSON.parse(c.content || '{}'); } catch (e) { continue; }
    const parts = [];
    (content.chapters || []).forEach(ch => {
      parts.push('【章节】' + (ch.title || ''));
      (ch.sections || []).forEach(s => {
        if (s.h) parts.push(s.h + '：');
        if (s.p) parts.push(s.p);
        if (Array.isArray(s.list)) parts.push(s.list.join('；'));
      });
    });
    result.push({ title: c.title, text: parts.join('\n').slice(0, 4000) });
  }
  return result;
}

/**
 * 从 LLM 文本中健壮地解析出 { questions: [...] }
 * 兼容：纯 JSON / 带 ```json 代码块 / 截断输出（尽力提取）
 */
function parseQuestionsFromText(text) {
  if (typeof text !== 'string') return null;
  let t = text.trim();
  // 去掉 markdown 代码块包裹
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 1) 直接解析
  try { return JSON.parse(t); } catch (e) { /* ignore */ }

  // 2) 提取首个 { 到最后一个 } 之间的对象
  const objMatch = t.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch (e) { /* ignore */ }
  }

  // 3) 退而求其次：直接提取 questions 数组
  const arrMatch = t.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const arr = JSON.parse(arrMatch[0]);
      if (Array.isArray(arr)) return { questions: arr };
    } catch (e) { /* ignore */ }
  }

  return null;
}

/**
 * 核心：调用 LLM 生成题目
 *
 * @param {Object} opts
 *   - count: 出题数量
 *   - mode: 'course' | 'external'
 *   - courseId: 课程 id（course 模式）
 *   - scopeText: 外部知识文本（external 模式）
 *   - scopeLabel: 来源名称（external 模式，如 URL 或资料名）
 *   - scopeUrl: 来源 URL（external 模式，可空）
 * @returns {Array} 结构化题目数组
 */
async function generateQuestions(opts) {
  const {
    count = 8,
    mode = 'course',
    courseId = null,
    scopeText = '',
    scopeLabel = '',
    scopeUrl = ''
  } = opts;

  const config = getConfig();
  if (!config || !config.apiKey) {
    throw new Error('LLM API 未配置，请在智能体页面配置 API Key 后再出题');
  }

  // 组装知识素材
  let knowledgeBlocks = [];
  let defaultSource = '';
  if (mode === 'course') {
    const courses = extractCourseText(courseId);
    if (courses.length === 0) throw new Error('未找到可用课程内容，请先确认课程数据已导入');
    knowledgeBlocks = courses.map(c => `### 课程《${c.title}》\n${c.text}`);
    defaultSource = courses.map(c => c.title).join('、');
  } else {
    if (!scopeText && !scopeUrl) throw new Error('外部模式必须提供文本或 URL');
    let text = scopeText;
    if (scopeUrl && !scopeText) {
      text = await fetchUrlText(scopeUrl);
    }
    knowledgeBlocks = [`### 外部资料《${scopeLabel || scopeUrl}》\n${text}`];
    defaultSource = scopeLabel || scopeUrl;
  }

  const knowledge = knowledgeBlocks.join('\n\n---\n\n').slice(0, 14000);

  const systemPrompt = `你是一位资深的「中国心理学会(CPS)三级心理咨询师水平评价考试」命题专家，熟悉《心理咨询基础培训教材·理论知识》与《心理咨询基础培训教材·咨询实务》两本命题用书。
你的任务：严格基于下面提供的【知识素材】出 ${count} 道高质量备考题目。
硬性要求：
1. 每道题必须 100% 基于给定素材，不得编造素材之外的知识点。
2. 每道题必须填写 source 字段，标明该题所依据的「教材章节」或「外部资料出处」(如「心理学导论·记忆」或资料名称/URL)，用于可信溯源与人工审核。
3. 题型从以下选择并在 category 字段标注：
   - theory_single(理论单选)、theory_multiple(理论多选)、theory_judge(理论判断)
   - practice_single(实务单选)、practice_multiple(实务多选)、practice_case(实务案例不定项)
   选择题 options 为 4 个选项的数组；判断题 options 为 ["正确","错误"]；案例题 options 为 4 个。
4. answer：单选题为选项字母(A/B/C/D)；多选题为字母组合(如"AB")；判断题为"正确"或"错误"；案例题为字母组合。
5. explanation：给出解析，并点明对应知识点与出处。
6. difficulty：easy/medium/hard；weight：高频3/中频2/低频1（依据该考点在考纲中的重要性）。`;

  const userPrompt = `【知识素材开始】\n${knowledge}\n【知识素材结束】

请基于上述素材出 ${count} 道题，仅返回如下 JSON（不要多余说明）：
{
  "questions": [
    {
      "category": "theory_single",
      "question": "题干",
      "options": ["A...","B...","C...","D..."],
      "answer": "B",
      "explanation": "解析（点明知识点与出处）",
      "source": "心理学导论·记忆",
      "difficulty": "easy",
      "weight": 3
    }
  ]
}
注意：options 对判断题固定为 ["正确","错误"]；答案必须能在 options 中找到；source 必填且真实可查。`;

  // 调用 LLM 生成，带重试与健壮 JSON 解析
  // （DeepSeek 偶发返回被截断或带 markdown 代码块的输出，直接解析会失败，
  //   这里剥离代码块、提取数组，并在失败时最多重试 2 次）
  const ATTEMPTS = 3;
  let lastErr = null;
  let result = null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const retryNote = attempt > 0
      ? '\n\n【重试要求】你上一次的输出无法被解析为标准 JSON。请严格只返回一个 JSON 对象，' +
        '不要使用 ``` 代码块标记，不要输出任何多余说明文字。'
      : '';
    try {
      const text = await chat([
        { role: 'system', content: systemPrompt + retryNote },
        { role: 'user', content: userPrompt }
      ], { temperature: 0.4, max_tokens: 8000, timeout: 120000, json: true });

      result = parseQuestionsFromText(text);
      if (result && Array.isArray(result.questions) && result.questions.length > 0) {
        break; // 成功解析，退出重试
      }
      lastErr = new Error('LLM 返回格式异常，未找到有效的 questions 数组');
    } catch (e) {
      lastErr = e;
      console.warn(`[QuestionAgent] 第 ${attempt + 1} 次生成/解析失败: ${e.message}`);
    }
  }

  if (!result || !Array.isArray(result.questions)) {
    throw lastErr || new Error('出题失败：LLM 返回无法解析');
  }

  // 校验与规整
  const valid = [];
  for (const q of result.questions) {
    if (!q.question || !q.answer) continue;
    const cat = q.category;
    const isTheory = CATEGORIES.theory.includes(cat);
    const isPractice = CATEGORIES.practice.includes(cat);
    if (!isTheory && !isPractice) continue;
    let options = q.options;
    if (cat === 'theory_judge' && (!Array.isArray(options) || options.length !== 2)) {
      options = ['正确', '错误'];
    }
    if ((isTheory || isPractice) && cat !== 'theory_judge' && (!Array.isArray(options) || options.length < 2)) {
      continue; // 选择题必须有选项
    }
    valid.push({
      category: cat,
      question: String(q.question).slice(0, 500),
      options: options || null,
      answer: String(q.answer),
      explanation: String(q.explanation || '').slice(0, 800),
      source: String(q.source || defaultSource).slice(0, 200),
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      weight: [1, 2, 3].includes(q.weight) ? q.weight : 2
    });
  }

  if (valid.length === 0) {
    throw new Error('生成的题目均未通过校验（缺少题干/答案/选项或来源）');
  }
  return valid;
}

/**
 * 对外入口：生成题目并写入 pending_updates 队列
 *
 * @param {Object} opts - 同 generateQuestions
 * @param {string} trigger - 'manual' | 'cron'
 * @returns {Object} { generated, saved, ids }
 */
async function run(opts = {}, trigger = 'manual') {
  const runId = db.prepare(`
    INSERT INTO agent_runs (agent_type, trigger, status, started_at)
    VALUES ('question', ?, 'running', datetime('now'))
  `).run(trigger).lastInsertRowid;

  try {
    const questions = await generateQuestions(opts);
    let saved = 0;
    const ids = [];

    const insert = db.prepare(`
      INSERT INTO pending_updates (id, agent_type, title, summary, content, source, source_url, ai_confidence, status)
      VALUES (?, 'question', ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const tx = db.transaction((items) => {
      for (const q of items) {
        const id = genId();
        const title = q.question.length > 60 ? q.question.slice(0, 60) + '…' : q.question;
        const summary = `答案：${q.answer}｜难度：${q.difficulty}｜权重：${q.weight}\n${q.explanation.slice(0, 120)}`;
        const content = JSON.stringify({
          category: q.category,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          source: q.source,
          difficulty: q.difficulty,
          weight: q.weight
        });
        insert.run(id, title, summary, content, q.source, opts.scopeUrl || '', 0.85);
        ids.push(id);
        saved++;
      }
    });
    tx(questions);

    db.prepare(`UPDATE agent_runs SET status='success', items_found=?, items_saved=?, finished_at=datetime('now') WHERE id=?`)
      .run(questions.length, saved, runId);

    return { generated: questions.length, saved, ids };
  } catch (e) {
    db.prepare(`UPDATE agent_runs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?`)
      .run(e.message, runId);
    throw e;
  }
}

module.exports = { run, generateQuestions };
