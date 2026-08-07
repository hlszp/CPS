/**
 * CPS三级备考平台 · 资讯概览模块
 * 左侧 Tab 切换资讯板块（最新资讯 / 考试动态 / 职业展望 / 学术前沿 / 权威资源 / 考试日历）
 * 每个 Tab 含预览 + "更多 →" 进入完整子栏目
 */
var NewsModule = (function() {

  /* 资讯板块 Tab 配置 */
  var TABS = [
    { key: 'latest',   icon: '📰', label: '最新资讯', sub: '#/news/latest',   desc: '智能体实时采集的心理学前沿动态（经人工审核发布）' },
    { key: 'exam',     icon: '📢', label: '考试动态', sub: '#/news/exam',     desc: 'CPS 考核政策、大纲与考期安排' },
    { key: 'career',   icon: '💼', label: '职业展望', sub: '#/news/career',   desc: '心理咨询师职业发展路径与行业规范' },
    { key: 'research', icon: '🔬', label: '学术前沿', sub: '#/news/research', desc: '心理学研究新发现与理论进展' },
    { key: 'resource', icon: '🌐', label: '权威资源', sub: '#/news/resource', desc: '国内外权威机构与文献库导航' },
    { key: 'calendar', icon: '📅', label: '考试日历', sub: '#/news/calendar', desc: '2026 年 CPS 三级考期安排' }
  ];

  /* 分类 → 标签样式映射 */
  var CAT = {
    exam:     { tag: 'tag-exam',     label: '考试动态' },
    career:   { tag: 'tag-career',   label: '职业展望' },
    research: { tag: 'tag-research', label: '学术研究' },
    resource: { tag: 'tag-resource', label: '权威资源' }
  };

  // ================================================================
  // 主页面：左侧 Tab + 右侧预览
  // ================================================================
  function render(app) {
    app.innerHTML =
      '<div class="news-page">' +
        '<div class="news-header">' +
          '<h2>资讯概览</h2>' +
          '<p>CPS 考核动态、心理咨询职业展望、国内外权威心理学资源与最新学术研究</p>' +
        '</div>' +
        '<div class="learning-center" id="newsCenter">' +
          '<div class="lc-header"><h2>🗞️ 资讯中心</h2><p class="lc-subtitle">Tab 快速切换资讯板块 · 点击右侧「更多 →」进入完整栏目</p></div>' +
          '<div class="lc-body">' +
            '<nav class="lc-tabs">' +
              TABS.map(function (t, i) {
                return '<button class="lc-tab ' + (i === 0 ? 'active' : '') + '" data-nt="' + t.key + '">' + t.icon + ' ' + t.label + '</button>';
              }).join('') +
            '</nav>' +
            '<div class="lc-panels">' +
              TABS.map(function (t, i) {
                return '<div class="lc-panel ' + (i === 0 ? 'active' : '') + '" data-panel="' + t.key + '">' +
                  '<div class="nt-panel-head"><h3>' + t.icon + ' ' + t.label + '</h3><span class="nt-panel-desc">' + t.desc + '</span></div>' +
                  '<div class="nt-panel-body" id="nt-body-' + t.key + '"><div class="nt-loading">加载中...</div></div>' +
                  '<a href="' + t.sub + '" class="lc-more">查看全部' + t.label + ' →</a>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    initNewsTabs();
    loadAllPanels();
  }

  /* 初始化资讯 Tab 切换（作用域限定在 #newsCenter，避免与首页学习中心冲突） */
  function initNewsTabs() {
    var root = document.getElementById('newsCenter');
    if (!root) return;
    var tabs = root.querySelectorAll('.lc-tab');
    var pans = root.querySelectorAll('.lc-panel');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var k = t.dataset.nt;
        tabs.forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        pans.forEach(function (p) { p.classList.toggle('active', p.dataset.panel === k); });
      });
    });
  }

  /* 加载所有 Tab 面板预览 */
  function loadAllPanels() {
    TABS.forEach(function (t) {
      var box = document.getElementById('nt-body-' + t.key);
      if (!box) return;
      if (t.key === 'latest') {
        loadLatest(box, 6);       // 最新资讯：异步从数据库加载，预览 6 条
      } else {
        box.innerHTML = staticHtml(t.key, 6);  // 其余：静态精选预览 6 条
      }
    });
  }

  // ================================================================
  // 子栏目整页（#/news/:category）
  // ================================================================
  function renderCategory(app, cat) {
    var tab = null;
    TABS.forEach(function (t) { if (t.key === cat) tab = t; });
    if (!tab) {
      app.innerHTML = '<div class="news-page"><div class="news-header"><h2>栏目不存在</h2><p>未找到该资讯栏目</p></div></div>';
      return;
    }

    app.innerHTML =
      '<div class="news-page">' +
        '<div class="nt-back-wrap"><a href="#/news" class="nt-back">← 返回资讯概览</a></div>' +
        '<div class="news-header" style="text-align:left;margin-bottom:24px">' +
          '<h2>' + tab.icon + ' ' + tab.label + '</h2>' +
          '<p>' + tab.desc + '</p>' +
        '</div>' +
        '<div class="nt-cat-body" id="nt-cat-body"><div class="nt-loading">加载中...</div></div>' +
      '</div>';

    var box = document.getElementById('nt-cat-body');
    if (cat === 'latest') {
      loadLatest(box, 0, true);   // 0 = 不限条数；isFull=true 显示采集说明
    } else {
      box.innerHTML = staticHtml(cat, 0);
    }
  }

  // ================================================================
  // 动态资讯（智能体采集 → 人工审核 → news 表）
  // ================================================================
  async function loadLatest(box, limit, isFull) {
    try {
      var resp = await fetch('/api/news');
      var data = await resp.json();
      var news = (data.news || []).slice();

      // 按发布时间倒序（兼容英文 RFC 日期与 ISO 日期）
      news.sort(function (a, b) {
        var ta = parseDate(a.published_at || a.created_at || 0);
        var tb = parseDate(b.published_at || b.created_at || 0);
        return tb - ta;
      });

      if (news.length === 0) {
        box.innerHTML = '<div class="nt-empty">暂无动态资讯，审核通过的内容将显示在此处</div>';
        return;
      }
      if (limit > 0) news = news.slice(0, limit);

      var head = isFull
        ? '<div class="nt-latest-note">🤖 本栏目内容由智能体自动采集心理学前沿信息，并经人工审核后发布，共 ' + (data.news ? data.news.length : news.length) + ' 条。</div>'
        : '';

      box.innerHTML = head + '<div class="news-cards">' +
        news.map(function (n) { return newsCardHtml(n); }).join('') +
      '</div>';
    } catch (e) {
      box.innerHTML = '<div class="nt-empty">资讯加载失败，请稍后重试</div>';
    }
  }

  function parseDate(v) {
    if (!v) return 0;
    var t = new Date(v).getTime();
    return isNaN(t) ? 0 : t;
  }

  /* 渲染单条已发布资讯卡片 */
  function newsCardHtml(n) {
    var cat = CAT[n.category] || CAT.research;
    var raw = n.published_at || n.created_at || '';
    var date = formatDate(raw);
    var summary = n.summary || '';
    if (summary.length > 200) summary = summary.slice(0, 200) + '...';
    var content = n.content || '';
    if (content.length > 300) content = content.slice(0, 300) + '...';

    var srcHtml = '';
    if (n.source) {
      var url = n.source_url || ('https://' + n.source);
      srcHtml = '<div class="news-card-footer">来源：<a class="news-src" href="' + url + '" target="_blank" rel="noopener">' + escapeHtml(n.source) + '</a></div>';
    }

    return '<div class="news-card">' +
      '<div class="news-card-header">' +
        '<span class="news-tag ' + cat.tag + '">' + cat.label + '</span>' +
        '<span class="news-date">' + escapeHtml(date) + '</span>' +
      '</div>' +
      '<h4 class="news-card-title">' + escapeHtml(n.title) + '</h4>' +
      '<p class="news-card-body">' + escapeHtml(summary || content) + '</p>' +
      srcHtml +
    '</div>';
  }

  function formatDate(raw) {
    if (!raw) return '';
    // 已是 YYYY-MM-DD 风格
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    var d = new Date(raw);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return raw.slice(0, 10);
  }

  // ================================================================
  // 静态精选内容（考试动态 / 职业展望 / 学术前沿 / 权威资源 / 考试日历）
  // limit: 0 表示全部
  // ================================================================
  function staticHtml(key, limit) {
    switch (key) {
      case 'exam':     return examSection(limit);
      case 'career':   return careerSection(limit);
      case 'research': return researchSection(limit);
      case 'resource': return resourceSection();
      case 'calendar': return calendarSection();
      default:         return '';
    }
  }

  function examSection(limit) {
    var items = [
      { title: '2026年CPS三级心理咨询师水平评价考试启动', date: '2026-02', tag: 'tag-exam', label: '考试动态',
        content: '中国心理学会于2026年2月正式发布《心理咨询师水平评价规范》，启动四级/三级/二级/一级心理评价体系。三级（进阶级）面向已完成基础培训并具备一定咨询实践经验的从业人员。2026年安排两次试点考试：8月8日（第一次试点）和12月26日（第二次试点）。考试设"心理学综合"和"咨询实务"两个科目，均需达到60分及以上方为合格。', src: 'sppj.psysoc.org.cn' },
      { title: 'CPS水平评价证书与原心理咨询师资格证的关系', date: '2026-02', tag: 'tag-policy', label: '政策解读',
        content: '2017年国家取消心理咨询师职业资格考试后，行业进入"去行政化"阶段。中国心理学会推出的CPS水平评价体系是目前国内最具学术权威性的心理咨询专业能力评价标准。CPS证书不等同于原国家职业资格证，但其学术认可度和行业影响力持续提升，已被多家医疗机构、高校心理中心、EAP服务机构作为岗位准入参考。', src: 'psysoc.org.cn' },
      { title: '三级考核命题依据与考试大纲解读', date: '2026-03', tag: 'tag-exam', label: '大纲解读',
        content: '三级考试以《心理咨询基础培训教材·理论知识》和《心理咨询基础培训教材·咨询实务》为唯一命题来源。理论科目涵盖心理学导论、社会心理学、人格心理学、发展心理学、异常心理学、咨询心理学6门课程；实务科目涵盖心理测量与评估、通用技术、CBT、人本主义、团体辅导、伦理实务、危机干预、实务练习8门课程。考试形式为线下机考，全国统一命题、统一阅卷。', src: 'sppj.psysoc.org.cn' },
      { title: '单科成绩有效期与补考政策', date: '2026-03', tag: 'tag-policy', label: '考试政策',
        content: 'CPS三级考试两科（心理学综合、咨询实务）需分别达到60分及以上。单科成绩有效期为3年，在有效期内可单独补考不合格科目。考生需在报名前完成指定培训学时，并由培训机构出具培训证明方可报名参加考试。', src: 'sppj.psysoc.org.cn' }
    ];
    return wrapCards(items, limit);
  }

  function careerSection(limit) {
    var items = [
      { title: '心理健康需求持续增长', date: '2026-01', tag: 'tag-career', label: '行业趋势',
        content: '据《中国国民心理健康发展报告》显示，我国心理健康服务需求逐年攀升。焦虑、抑郁、睡眠障碍等问题日益普遍，青少年心理健康问题尤其受到关注。国家卫健委发布的《健康中国行动——儿童青少年心理健康行动方案》明确提出加强心理健康服务体系建设，心理咨询师需求缺口显著。', src: 'nhc.gov.cn' },
      { title: '心理咨询师就业方向多元化', date: '2026-02', tag: 'tag-career', label: '就业指南',
        content: '持有CPS证书的心理咨询师主要就业方向包括：①医疗机构（精神卫生中心、综合医院临床心理科）；②教育系统（高校心理健康教育与咨询中心、中小学心理辅导室）；③企业EAP服务（员工心理援助计划）；④社会心理服务机构（心理咨询中心、社区心理服务站）；⑤司法系统（监狱、少管所心理矫治）；⑥自主执业（开设心理咨询工作室）。', src: '' },
      { title: '心理咨询行业规范化进程加速', date: '2026-03', tag: 'tag-career', label: '行业规范',
        content: '随着《精神卫生法》的深入实施和心理治疗与咨询分离原则的落实，心理咨询行业正加速规范化。CPS水平评价体系的推出，为行业提供了统一的专业能力参考标准。未来趋势：注册制管理趋严、继续教育学分制、督导时数要求提高、伦理监管加强。持有高级别CPS证书（二级、一级）将在专业竞争中更具优势。', src: 'psysoc.org.cn' },
      { title: '心理咨询师收入水平与成长路径', date: '2026-01', tag: 'tag-career', label: '薪酬参考',
        content: '心理咨询师收入因地区、机构、经验差异较大。一线城市新手咨询师时薪约200-400元，成熟咨询师时薪500-1500元。职业成长路径通常为：助理咨询师→咨询师→高级咨询师→督导师。持续接受个人体验、专业督导和继续教育是职业发展的核心要素。CPS三级证书是走向专业心理咨询师的重要里程碑。', src: '' }
    ];
    return wrapCards(items, limit);
  }

  function researchSection(limit) {
    var items = [
      { title: '第三浪潮认知行为疗法的循证研究', date: '2026-01', tag: 'tag-research', label: '学术前沿',
        content: '第三代CBT（ACT接纳承诺疗法、DBT辩证行为疗法、MBCT正念认知疗法）的循证研究持续深化。近年来研究热点包括：ACT对慢性疼痛和焦虑障碍的疗效机制、DBT对边缘型人格障碍的长期效果追踪、正念干预在抑郁复发预防中的Meta分析结果。CPS三级考试中CBT相关题目也逐步纳入第三浪潮概念。', src: '' },
      { title: '心理咨询效果研究的共同因素模型', date: '2026-02', tag: 'tag-research', label: '理论前沿',
        content: '心理咨询效果研究中，"共同因素模型"（治疗关系、来访者期望、共情等）持续受到关注。Wampold的元分析研究表明，治疗关系对咨询效果的贡献远大于特定技术。这一发现对实务工作者具有重要启示：建立稳固的咨访关系是有效咨询的基础。CPS三级实务考试中"咨询关系"相关知识点是高频考点。', src: '' },
      { title: 'AI辅助心理评估与干预的伦理探讨', date: '2026-03', tag: 'tag-research', label: '交叉前沿',
        content: '人工智能在心理健康领域的应用引发广泛讨论：AI聊天机器人用于心理健康筛查和初步干预的效果评估、AI辅助诊断的准确性与局限性、数据隐私与算法公平性问题。中国心理学会伦理守则也在持续更新中，关注技术伦理边界。心理咨询师需了解AI工具的辅助定位，不可替代专业判断。', src: '' },
      { title: '创伤知情照护（TIC）理念的发展', date: '2026-01', tag: 'tag-research', label: '实务前沿',
        content: '创伤知情照护（Trauma-Informed Care）理念在各心理健康服务领域推广。核心原则包括：安全感、信任、选择、协作、赋能。研究显示，超过60%的来访者有不同程度创伤经历，咨询师需具备创伤敏感的评估和干预能力。CPS三级危机干预课程中已纳入创伤相关知识点。', src: '' },
      { title: '青少年心理健康的循证干预', date: '2026-02', tag: 'tag-research', label: '发展前沿',
        content: '青少年焦虑、抑郁、自伤行为检出率上升，循证干预研究成为热点。学校心理健康服务体系构建、家庭治疗在青少年情绪障碍中的应用、团体CBT对青少年社交焦虑的疗效等方向成果显著。发展心理学和咨询实务的交叉研究为青少年心理咨询提供了更精细化的指导框架。', src: '' }
    ];
    return wrapCards(items, limit);
  }

  function wrapCards(items, limit) {
    var list = limit > 0 ? items.slice(0, limit) : items;
    return '<div class="news-cards">' +
      list.map(function (it) {
        return renderNewsCard(it.title, it.date, it.tag, it.label, it.content, it.src);
      }).join('') +
    '</div>';
  }

  function resourceSection() {
    return '<div class="news-resources">' +
      renderResourceGroup('国内权威机构', [
        { name: '中国心理学会（CPS）', url: 'https://www.psysoc.org.cn/', desc: '中国心理学界最高学术权威机构，CPS水平评价证书颁发单位' },
        { name: 'CPS心理咨询师水平评价工作网', url: 'https://sppj.psysoc.org.cn/#/home', desc: 'CPS水平评价官方报名、成绩查询、证书验证平台' },
        { name: '中国心理学会临床与咨询心理学专业委员会', url: 'https://www.cpsa.org.cn/', desc: '临床与咨询心理学专业规范、伦理准则制定机构' },
        { name: '中国科学院心理研究所', url: 'http://www.psych.ac.cn/', desc: '国家级心理学研究机构，提供心理健康科研资源' },
        { name: '中国心理卫生协会', url: 'http://www.camh.org.cn/', desc: '心理健康领域专业学术团体，行业培训与学术交流' },
        { name: '国家卫生健康委员会', url: 'http://www.nhc.gov.cn/', desc: '国家心理健康政策发布、精神卫生法规查询' },
        { name: '中国知网（CNKI）', url: 'https://www.cnki.net/', desc: '心理学中文学术论文与文献检索平台' },
        { name: '万方数据', url: 'https://www.wanfangdata.com.cn/', desc: '中文学术文献数据库，可检索心理学相关研究' }
      ]) +
      renderResourceGroup('国际权威组织与数据库', [
        { name: '美国心理学会（APA）', url: 'https://www.apa.org/', desc: '全球最大的心理学专业组织，提供心理学标准和循证实践指南' },
        { name: 'APA PsycNET', url: 'https://psycnet.apa.org/', desc: 'APA心理学文献数据库，含期刊、书籍、 dissertation' },
        { name: 'PubMed Central', url: 'https://www.ncbi.nlm.nih.gov/pmc/', desc: '美国国立卫生研究院生物医学文献库，可检索心理咨询疗效研究' },
        { name: 'Cochrane Library', url: 'https://www.cochranelibrary.com/', desc: '循证医学数据库，提供心理咨询干预的系统综述和Meta分析' },
        { name: 'DSM-5 (APA)', url: 'https://www.psychiatry.org/psychiatrists/practice/dsm', desc: '美国精神医学学会精神障碍诊断与统计手册，异常心理学重要参考' },
        { name: 'WHO心理健康', url: 'https://www.who.int/health-topics/mental-health', desc: '世界卫生组织心理健康专题，全球心理健康数据与指南' },
        { name: 'Psychology Today', url: 'https://www.psychologytoday.com/', desc: '心理学科普资源与治疗师查找平台' },
        { name: 'Society for Psychotherapy Research', url: 'https://www.psychotherapyresearch.org/', desc: '国际心理治疗研究学会，心理咨询效果研究前沿' }
      ]) +
      renderResourceGroup('专业期刊与学术出版', [
        { name: '《心理学报》', url: 'https://journal.psych.ac.cn/', desc: '中国心理学会会刊，国内心理学最高学术期刊' },
        { name: '《心理科学》', url: 'https://www.psysoc.org.cn/', desc: '中国心理学会主办，心理学综合学术期刊' },
        { name: '《中国临床心理学杂志》', url: 'http://www.clinicalpsychology.cn/', desc: '临床心理学领域核心期刊' },
        { name: 'Journal of Consulting and Clinical Psychology', url: 'https://www.apa.org/pubs/journals/ccp/', desc: 'APA咨询与临床心理学期刊，循证治疗研究权威' },
        { name: 'Journal of Counseling Psychology', url: 'https://www.apa.org/pubs/journals/cou/', desc: 'APA咨询心理学期刊，咨询过程与效果研究' },
        { name: 'Psychotherapy Research', url: 'https://www.tandfonline.com/toc/tpsr20/current', desc: 'SPR官方期刊，心理治疗过程与结果研究' }
      ]) +
    '</div>';
  }

  function calendarSection() {
    return '<div class="news-calendar">' +
      '<div class="cal-item">' +
        '<div class="cal-date"><span class="cal-month">8月</span><span class="cal-day">8</span></div>' +
        '<div class="cal-content"><div class="cal-title">2026年第一次试点考试</div><div class="cal-desc">心理学综合 + 咨询实务 · 线下机考</div></div>' +
      '</div>' +
      '<div class="cal-item">' +
        '<div class="cal-date"><span class="cal-month">12月</span><span class="cal-day">26</span></div>' +
        '<div class="cal-content"><div class="cal-title">2026年第二次试点考试</div><div class="cal-desc">心理学综合 + 咨询实务 · 线下机考</div></div>' +
      '</div>' +
    '</div>';
  }

  // ================================================================
  // 公共辅助函数
  // ================================================================
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderNewsCard(title, date, tagClass, tagText, content, source) {
    var srcHtml = source ? '<a class="news-src" href="https://' + source + '" target="_blank" rel="noopener">' + source + '</a>' : '';
    return '<div class="news-card">' +
      '<div class="news-card-header">' +
        '<span class="news-tag ' + tagClass + '">' + tagText + '</span>' +
        '<span class="news-date">' + date + '</span>' +
      '</div>' +
      '<h4 class="news-card-title">' + title + '</h4>' +
      '<p class="news-card-body">' + content + '</p>' +
      (srcHtml ? '<div class="news-card-footer">来源：' + srcHtml + '</div>' : '') +
    '</div>';
  }

  function renderResourceGroup(groupTitle, resources) {
    var html = '<div class="res-group"><h4 class="res-group-title">' + groupTitle + '</h4><div class="res-grid">';
    resources.forEach(function (r) {
      html += '<a class="res-card" href="' + r.url + '" target="_blank" rel="noopener">' +
        '<div class="res-name">' + r.name + '</div>' +
        '<div class="res-desc">' + r.desc + '</div>' +
        '<div class="res-url">' + r.url.replace(/^https?:\/\//, '').replace(/\/$/, '') + '</div>' +
      '</a>';
    });
    html += '</div></div>';
    return html;
  }

  return { render: render, renderCategory: renderCategory };
})();
