/**
 * 新闻采集 Agent
 *
 * 工作流程：
 * 1. 从配置的 RSS 源和网页 URL 采集心理学相关内容
 * 2. 调用 LLM 对每条内容进行：去重判断、摘要生成、分类标签、考纲相关性评估
 * 3. 将符合条件的内容写入 pending_updates 表，等待人工审核
 *
 * 触发方式：cron 定时 / CMS 手动触发
 */

const db = require('../db');
const { chat, chatJSON, getConfig } = require('./llm');
const crypto = require('crypto');

// ================================================================
// RSS 源配置（全部从服务器实测验证可用）
// ================================================================
const RSS_SOURCES = [
  // --- ScienceDaily 系列（每个源约 60 条，内容丰富） ---
  { name: 'ScienceDaily · 心理学研究',     url: 'https://www.sciencedaily.com/rss/mind_brain/psychology.xml',             lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 心理健康',       url: 'https://www.sciencedaily.com/rss/mind_brain/mental_health.xml',          lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 神经科学',       url: 'https://www.sciencedaily.com/rss/mind_brain/neuroscience.xml',           lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 社会心理学',     url: 'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',      lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 教育心理学',     url: 'https://www.sciencedaily.com/rss/mind_brain/educational_psychology.xml', lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 儿童发展',       url: 'https://www.sciencedaily.com/rss/mind_brain/child_development.xml',      lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 行为科学',       url: 'https://www.sciencedaily.com/rss/mind_brain/behavior.xml',               lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 自闭症',         url: 'https://www.sciencedaily.com/rss/mind_brain/autism.xml',                 lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 精神分裂症',     url: 'https://www.sciencedaily.com/rss/mind_brain/schizophrenia.xml',           lang: 'en', category: 'research' },
  { name: 'ScienceDaily · 医学心理健康',   url: 'https://www.sciencedaily.com/rss/health_medicine/mental_health.xml',    lang: 'en', category: 'research' },

  // --- Nature 系列（学术期刊，高质量） ---
  { name: 'Nature · 心理学',     url: 'https://www.nature.com/subjects/psychology.rss',   lang: 'en', category: 'research' },
  { name: 'Nature · 神经科学',   url: 'https://www.nature.com/subjects/neuroscience.rss', lang: 'en', category: 'research' },

  // --- Medical News Today（心理学新闻，RSS 稳定可用） ---
  { name: 'Medical News Today · 心理学', url: 'https://www.medicalnewstoday.com/rss/psychology', lang: 'en', category: 'research' },

  // --- Mind Hacks（神经科学与心理学博客） ---
  { name: 'Mind Hacks · 神经心理学', url: 'https://www.mindhacks.com/feed/', lang: 'en', category: 'research' },
];

// 额外的网页 URL（非 RSS，直接抓取页面由 LLM 提取）
const WEB_SOURCES = [
  // 可在此添加需要抓取的网页 URL
];

// ================================================================
// 文献源配置（每周触发，偏学术/期刊）
// ================================================================
const LITERATURE_SOURCES = [
  { name: 'PsyArXiv · 心理学预印本',     url: 'https://psyarxiv.com/latest/rss',                       lang: 'en', category: 'research' },
  { name: 'Frontiers in Psychology',     url: 'https://www.frontiersin.org/journals/psychology/rss',  lang: 'en', category: 'research' },
  { name: 'PLOS ONE · 心理学',           url: 'https://journals.plos.org/plosone/article_types/psychology', lang: 'en', category: 'research' },
  { name: 'APA PsycNet',                 url: 'https://psycnet.apa.org/rss/psychology',                 lang: 'en', category: 'research' },
  { name: 'Springer · 心理学',           url: 'https://link.springer.com/search.rss?facet-content-type=Journal&facet-discipline=52', lang: 'en', category: 'research' },
];

/**
 * 根据模式选择 RSS 源
 */
function getSources(mode) {
  return mode === 'literature' ? LITERATURE_SOURCES : RSS_SOURCES;
}

// ================================================================
// 工具函数
// ================================================================

/**
 * 生成唯一 ID
 */
function genId() {
  return 'pu_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

/**
 * 轻量 RSS / Atom 解析（正则提取，无需额外依赖）
 * 支持 RSS 2.0 (<item>) 和 Atom 1.0 (<entry>)
 */
function parseRSS(xml) {
  const items = [];

  // 如果内容看起来是 HTML（而非 XML），直接返回空
  if (/<html[\s>]/i.test(xml) || /<!DOCTYPE html/i.test(xml)) {
    console.warn('[NewsAgent] 内容非 RSS/Atom 格式（疑似 HTML 页面），跳过解析');
    return items;
  }

  // --- RSS 2.0 格式 ---
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const rssMatches = xml.match(itemRegex) || [];

  for (const itemXml of rssMatches) {
    const title = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
                  itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const link = itemXml.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ||
                 itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const desc = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                 itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    items.push({
      title: title ? title[1].trim() : '',
      link: link ? link[1].trim() : '',
      description: desc ? desc[1].replace(/<[^>]+>/g, '').trim() : '',
      pubDate: pubDate ? pubDate[1].trim() : ''
    });
  }

  // --- Atom 1.0 格式 ---
  const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
  const atomMatches = xml.match(entryRegex) || [];

  for (const entryXml of atomMatches) {
    const title = entryXml.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
                  entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    // Atom 的 link 用 href 属性
    const linkAttr = entryXml.match(/<link[^>]*href="([^"]+)"/i);
    const linkText = entryXml.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ||
                     entryXml.match(/<link>([\s\S]*?)<\/link>/i);
    const summary = entryXml.match(/<summary[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/i) ||
                    entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const content = entryXml.match(/<content[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content>/i) ||
                    entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
    const updated = entryXml.match(/<updated>([\s\S]*?)<\/updated>/i) ||
                    entryXml.match(/<published>([\s\S]*?)<\/published>/i);

    const desc = summary || content;

    items.push({
      title: title ? title[1].trim() : '',
      link: linkAttr ? linkAttr[1].trim() : (linkText ? linkText[1].trim() : ''),
      description: desc ? desc[1].replace(/<[^>]+>/g, '').trim() : '',
      pubDate: updated ? updated[1].trim() : ''
    });
  }

  return items;
}

/**
 * 抓取 URL 内容
 */
async function fetchURL(url, timeout = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // 如果返回的内容太短，可能是错误页面
    if (text.length < 100) {
      throw new Error(`内容过短 (${text.length} 字节)，可能非有效 RSS`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 检查 URL 是否已在 pending_updates 或 news 表中存在（去重）
 */
function isDuplicate(url) {
  // 检查 pending_updates
  const pending = db.prepare('SELECT id FROM pending_updates WHERE source_url = ? AND status = ?')
    .get(url, 'pending');
  if (pending) return true;

  // 检查已发布的 news
  const published = db.prepare('SELECT id FROM news WHERE source_url = ?').get(url);
  if (published) return true;

  // 检查已拒绝的（避免重复采集）
  const rejected = db.prepare('SELECT id FROM pending_updates WHERE source_url = ? AND status = ? AND created_at > datetime(\'now\', \'-7 days\')')
    .get(url, 'rejected');
  if (rejected) return true;

  return false;
}

// ================================================================
// LLM 处理
// ================================================================

/**
 * 用 LLM 对采集到的新闻条目进行处理：
 * - 判断与 CPS 心理咨询师考试的相关性
 * - 生成中文摘要
 * - 分类（exam/career/research/resource）
 * - 评估置信度
 *
 * @param {Object} item - { title, link, description, pubDate, sourceName }
 * @returns {Object|null} - { title, summary, category, confidence, relevant } 或 null（不相关）
 */
async function processWithLLM(item) {
  const config = getConfig();
  if (!config) {
    // 无 LLM 配置时，直接存储原始内容
    return {
      title: item.title,
      summary: item.description.slice(0, 200) || '无摘要',
      content: JSON.stringify({
        title: item.title,
        summary: item.description.slice(0, 500),
        content: item.description,
        source: item.sourceName,
        source_url: item.link,
        category: item.category || 'research',
        published_at: item.pubDate
      }),
      category: item.category || 'research',
      confidence: 0.3,
      relevant: true
    };
  }

  const prompt = `你是一个专业的心理学资讯分类编辑助手。请分析以下新闻条目，先判断它与中国"心理咨询师 CPS 培训/考试/职业发展"的相关性，再将其【严格且唯一】归入四类之一，并生成中文摘要。

新闻标题：${item.title}
来源：${item.sourceName}
描述：${item.description}

【四大分类定义与边界】
① exam（考试动态）——与心理咨询师考试/认证/培训直接相关：
   考试政策、报名/考期通知、考试大纲或教材变化、证书/资格标准、培训机构官方公告、中国心理学会/人社部相关文件。
② career（职业展望）——心理咨询职业发展：
   就业前景、行业动态、职业伦理、薪酬待遇、市场需求、从业路径、咨询师成长故事、行业规范。
③ resource（权威资源）——学习/参考资料：
   教材书单、课程推荐、研究方法、工具指南、科普干货、学习路径、阅读清单。
④ research（学术研究）——心理学学术研究新发现：
   脑科学/认知实验、临床试验、心理学实验成果、新理论模型、期刊论文发现。

【判定优先级】依次判断 exam → career → resource，三者都不符合时才归 research。
【常见边界示例】
- "某心理疗法的随机对照试验显示有效" → research
- "如何成为合格的心理咨询师" → career
- "2026 年 CPS 考试新增考点解读" → exam
- "推荐 5 本咨询必读书单" → resource
- "脑岛在共情中的作用机制研究" → research

请以 JSON 格式返回：
{
  "relevant": true/false,   // 是否与心理咨询师培训/考试/职业发展相关
  "title_cn": "中文标题",    // 英文则翻译，中文则保持
  "summary": "100-200字的中文摘要",
  "category": "exam|career|research|resource",
  "confidence": 0.0-1.0,
  "key_points": ["要点1", "要点2"]
}
注意：除非内容明确符合 exam/career/resource，否则不要归入 research；与心理学完全无关则返回 relevant: false。`;

  try {
    const result = await chatJSON([
      { role: 'system', content: '你是一个专业的心理学新闻编辑助手，熟悉中国心理咨询师培训和考试体系。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, max_tokens: 800 });

    if (!result.relevant) return null;

    const content = JSON.stringify({
      title: result.title_cn || item.title,
      summary: result.summary,
      content: item.description,
      key_points: result.key_points || [],
      source: item.sourceName,
      source_url: item.link,
      category: result.category || 'research',
      published_at: item.pubDate
    });

    return {
      title: result.title_cn || item.title,
      summary: result.summary,
      content: content,
      category: result.category || 'research',
      confidence: result.confidence || 0.5,
      relevant: true
    };
  } catch (e) {
    console.error('[NewsAgent] LLM 处理失败:', e.message);
    // 降级：直接存储原始内容
    return {
      title: item.title,
      summary: item.description.slice(0, 200) || '无摘要',
      content: JSON.stringify({
        title: item.title,
        summary: item.description,
        content: item.description,
        source: item.sourceName,
        source_url: item.link,
        category: 'research',
        published_at: item.pubDate
      }),
      category: 'research',
      confidence: 0.3,
      relevant: true
    };
  }
}

// ================================================================
// 主流程
// ================================================================

/**
 * 执行新闻采集
 * @param {string} trigger - 'cron' | 'manual'
 * @returns {Object} - { itemsFound, itemsSaved, errors }
 */
async function run(trigger = 'manual', mode = 'news') {
  console.log(`[NewsAgent] 开始执行 (trigger: ${trigger}, mode: ${mode})`);
  const agentType = mode === 'literature' ? 'literature' : 'news';

  // 记录执行
  const runRecord = db.prepare(`
    INSERT INTO agent_runs (agent_type, trigger, status, started_at)
    VALUES (?, ?, 'running', datetime('now'))
  `).run(agentType, trigger);
  const runId = runRecord.lastInsertRowid;

  let itemsFound = 0;
  let itemsSaved = 0;
  const fetchErrors = [];   // RSS/网页源抓取失败（非致命，单源失败不阻断整体）
  const processErrors = []; // LLM 处理单条失败（非致命，降级存储）

  try {
    // 1. 采集所有 RSS 源
    const allItems = [];
    const seenTitles = new Set(); // 标题去重（跨源）
    const SOURCES = getSources(mode);

    for (const source of SOURCES) {
      try {
        console.log(`[NewsAgent] 抓取 RSS: ${source.name}`);
        const xml = await fetchURL(source.url);
        const items = parseRSS(xml);

        if (items.length === 0) {
          console.warn(`[NewsAgent] ${source.name}: 解析到 0 条（可能非 RSS 格式或被 WAF 拦截）`);
        } else {
          console.log(`[NewsAgent] ${source.name}: 获取 ${items.length} 条`);
        }

        let added = 0;
        for (const item of items.slice(0, 25)) { // 每个源最多取 25 条
          if (!item.link || !item.title) continue;
          if (isDuplicate(item.link)) continue;

          // 标题去重（标准化后比较前 60 字符）
          const titleKey = item.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '').slice(0, 60);
          if (titleKey && seenTitles.has(titleKey)) continue;
          seenTitles.add(titleKey);

          allItems.push({
            ...item,
            sourceName: source.name,
            category: source.category
          });
          itemsFound++;
          added++;
        }
        if (added > 0) {
          console.log(`[NewsAgent] ${source.name}: 去重后新增 ${added} 条`);
        }
      } catch (e) {
        console.error(`[NewsAgent] 抓取 ${source.name} 失败:`, e.message);
        fetchErrors.push(`${source.name}: ${e.message}`);
      }
    }

    // 2. 抓取额外网页源
    for (const source of WEB_SOURCES) {
      try {
        const html = await fetchURL(source.url);
        // 简单提取标题和正文
        const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : source.name;
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);

        if (!isDuplicate(source.url)) {
          allItems.push({
            title: title,
            link: source.url,
            description: text,
            pubDate: new Date().toISOString(),
            sourceName: source.name,
            category: source.category || 'research'
          });
          itemsFound++;
        }
      } catch (e) {
        fetchErrors.push(`${source.name}: ${e.message}`);
      }
    }

    // 3. 限制每次处理数量（避免 LLM 调用过多）
    const toProcess = allItems.slice(0, 30);
    console.log(`[NewsAgent] 待处理: ${toProcess.length} 条 (总发现: ${itemsFound}, 去重后: ${allItems.length})`);

    // 更新进度：已发现条目数
    db.prepare(`UPDATE agent_runs SET items_found = ? WHERE id = ?`).run(itemsFound, runId);

    // 4. 逐条用 LLM 处理
    for (const item of toProcess) {
      try {
        const processed = await processWithLLM(item);
        if (!processed || !processed.relevant) {
          console.log(`[NewsAgent] 跳过(不相关): ${item.title.slice(0, 40)}`);
          continue;
        }

        // 写入 pending_updates
        db.prepare(`
          INSERT INTO pending_updates (id, agent_type, title, summary, content, source, source_url, ai_confidence, status)
          VALUES (?, 'news', ?, ?, ?, ?, ?, ?, 'pending')
        `).run(genId(), processed.title, processed.summary, processed.content,
            item.sourceName, item.link, processed.confidence);

        itemsSaved++;
        // 更新进度：已保存条目数
        db.prepare(`UPDATE agent_runs SET items_saved = ? WHERE id = ?`).run(itemsSaved, runId);
        console.log(`[NewsAgent] 已保存: ${processed.title.slice(0, 40)}`);
      } catch (e) {
        console.error(`[NewsAgent] 处理失败: ${item.title.slice(0, 40)}`, e.message);
        processErrors.push(`处理失败: ${e.message}`);
      }
    }

    // 5. 更新执行记录
    // 单源抓取失败 / 单条处理失败均为非致命：只要整体采到内容即视为成功，
    // 仅当“所有源都失败、0 条发现”时才标记错误，避免面板把个别 RSS 403 当成整体故障。
    const allSourceFailed = itemsFound === 0 && fetchErrors.length > 0;
    const runError = allSourceFailed
      ? '所有 RSS 源采集失败: ' + fetchErrors.join('; ')
      : null;
    db.prepare(`
      UPDATE agent_runs SET status = ?, items_found = ?, items_saved = ?, finished_at = datetime('now'), error = ?
      WHERE id = ?
    `).run('success', itemsFound, itemsSaved, runError, runId);

    console.log(`[NewsAgent] 完成: 发现 ${itemsFound}, 保存 ${itemsSaved}, 错误 ${fetchErrors.length + processErrors.length}`);

    return { itemsFound, itemsSaved, errors };

  } catch (e) {
    // 执行失败
    db.prepare(`
      UPDATE agent_runs SET status = ?, finished_at = datetime('now'), error = ?
      WHERE id = ?
    `).run('failed', e.message, runId);

    console.error('[NewsAgent] 执行失败:', e.message);
    throw e;
  }
}

/**
 * 复用分类能力：对已有内容重新判定分类（供后台"AI 智能重分类"使用）
 * @param {string} title - 标题（可为中文或英文）
 * @param {string} description - 描述/正文
 * @returns {Promise<string>} - 'exam' | 'career' | 'research' | 'resource'
 */
async function classifyContent(title, description) {
  const config = getConfig();
  if (!config) return 'research';

  const prompt = `你是专业的心理学资讯分类助手。请将下面这条资讯【严格且唯一】归入四类之一。

标题：${title}
描述：${description || ''}

【四大分类】
① exam（考试动态）：心理咨询师考试/认证/培训政策、报名、大纲教材变化、证书资格、官方公告。
② career（职业展望）：就业前景、行业动态、职业伦理、薪酬、市场需求、从业路径、成长故事。
③ resource（权威资源）：教材书单、课程推荐、研究方法、工具指南、科普干货、学习路径。
④ research（学术研究）：脑科学/认知实验、临床试验、心理学实验成果、新理论、期刊论文发现。

判定优先级：exam → career → resource，三者都不符合才归 research。
仅返回 JSON：{"category":"exam|career|research|resource","confidence":0.0-1.0}`;

  try {
    const r = await chatJSON([
      { role: 'system', content: '你是心理学资讯分类专家，严格按规则分类。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, max_tokens: 200 });
    const allowed = ['exam', 'career', 'research', 'resource'];
    return allowed.includes(r.category) ? r.category : 'research';
  } catch (e) {
    console.error('[NewsAgent] classifyContent 失败:', e.message);
    return 'research';
  }
}

module.exports = { run, classifyContent };
