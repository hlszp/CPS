/**
 * CPS三级备考平台 · 主应用
 * 哈希路由 + 首页渲染 + 导航控制
 */
(function() {
  const app = document.getElementById('app');

  /* 初始化 AI 答疑悬浮对话框 */
  AIChat.init();

  /* 初始化用户认证 UI */
  AuthUI.init();

  function renderHome() {
    const featuredTheory = THEORY_COURSES.slice(0, 3);
    const featuredPractice = PRACTICE_COURSES.slice(0, 3);

    // ===== 课程卡片 =====
    const theoryCards = featuredTheory.map(c => `
      <div class="course-card" onclick="location.hash='#/courses/theory/${c.id}'">
        <div class="card-icon" style="background:${c.color};">${c.icon}</div>
        <span class="card-tag tag-theory">理论</span>
        <div class="card-title">${c.title}</div>
        <div class="card-desc">${c.desc.substring(0, 80)}...</div>
      </div>`).join('');

    const practiceCards = featuredPractice.map(c => `
      <div class="course-card" onclick="location.hash='#/courses/practice/${c.id}'">
        <div class="card-icon" style="background:${c.color};">${c.icon}</div>
        <span class="card-tag tag-practice">实务</span>
        <div class="card-title">${c.title}</div>
        <div class="card-desc">${c.desc.substring(0, 80)}...</div>
      </div>`).join('');

    // ===== 横幅数据 =====
    const banners = [
      { img:'assets/banners/banner1.png', title:'CPS 三级心理咨询师<br>水平评价考试备考平台',
        subtitle:'基于中国心理学会指定教材，系统讲解基础理论6门与实务8门课程，提供知识检索与全真模拟测试。',
        cta:[{t:'进入课程中心',h:'#/courses'},{t:'开始模拟测试',h:'#/quiz'}] },
      { img:'assets/banners/banner2.png', title:'14 门系统课程<br>覆盖全部考点',
        subtitle:'理论知识 6 门 + 咨询实务 8 门，每门含章节讲解与配套练习，紧扣官方教材。',
        cta:[{t:'浏览全部课程',h:'#/courses'}] },
      { img:'assets/banners/banner3.png', title:'AI 全真模拟测试<br>加权组卷 · 精准预测',
        subtitle:'完全模仿 CPS 三级考试题型与分值，高频考点出现概率更高，每次出卷随机打乱顺序与选项。',
        cta:[{t:'立即模拟测试',h:'#/quiz'}] },
      { img:'assets/banners/banner4.png', title:'知识图谱<br>系统化学习路径',
        subtitle:'<span data-stat="knowledgeNodes">369</span> 个知识节点、<span data-stat="knowledgeEdges">420</span> 条关联边，构建完整的心理学知识网络，支持模糊搜索与可视化探索。',
        cta:[{t:'探索知识图谱',h:'#/knowledge'}] },
      { img:'assets/banners/banner5.png', title:'权威认证 · 职业前景<br>开启专业成长之路',
        subtitle:'中国心理学会 CPS 三级证书，单科成绩 3 年有效，60 分及格。两次试点考试机会。',
        cta:[{t:'查看考试详情',h:'#exam-info'}] }
    ];

    // ===== Tab 面板内容 =====
    const panels = {
      theory: `<div class="course-grid" id="lcTheoryCards">${theoryCards}</div><a href="#/courses" class="lc-more">查看全部理论课程 →</a>`,
      practice: `<div class="course-grid" id="lcPracticeCards">${practiceCards}</div><a href="#/courses" class="lc-more">查看全部实务课程 →</a>`,
      knowledge: `<div class="kg-preview-card"><div class="kg-preview-icon">🕸️</div><h3>知识图谱探索</h3><p><span data-stat="knowledgeNodes">369</span> 个节点 · <span data-stat="knowledgeEdges">420</span> 条关联边 · 力导向布局交互</p><p style="margin-top:8px;color:var(--text-secondary)">14 门课程关键概念分层组织，支持模糊搜索点亮知识点，呈现概念间逻辑关系。</p></div><a href="#/knowledge" class="lc-more">进入知识探索 →</a>`,
      'practice-quiz': `<div class="tool-preview-cards"><div class="tp-card"><span class="tp-icon">🃏</span><h4>翻转卡片练习</h4><p>按章节分类，正面答题翻面看解析</p></div><div class="tp-card"><span class="tp-icon">📊</span><h4>进度追踪</h4><p>记录答题正确率与连续打卡天数</p></div></div><a href="#/practice" class="lc-more">进入练习测验 →</a>`,
      quiz: `<div class="quiz-preview-card"><div class="qpc-badge">AI 加权组卷</div><h3>全真模拟 CPS 三级考试</h3><ul class="qpc-list"><li>理论科 250 题（单选 150 + 多选 50 + 判断 50）</li><li>实务科 210 题（单选 140 + 多选 60 + 案例 10）</li><li>高频考点出现概率是低频 3 倍</li><li>计时评分 + 详细解析 + AI 答疑</li></ul></div><a href="#/quiz" class="lc-more">开始全真模拟 →</a>`,
      daily: `<div class="daily-preview-card"><div class="dpc-icon">📅</div><h3>每日一练打卡</h3><p>每天从题库按权重随机抽取 5-10 题，稳定不重排，培养备考节奏感。</p><p style="margin-top:8px;color:var(--text-secondary)">今日题目已生成，随时可以开始作答！</p></div><a href="#/daily" class="lc-more">开始每日一练 →</a>`,
      news: `<div class="news-preview-mini"><h4 style="margin-bottom:12px">最新资讯动态</h4><div id="homeNewsList"><p style="color:var(--text-secondary);font-size:14px">CPS 考核新闻、心理咨询职业展望、国内外权威心理学资源导航、最新学术研究进展。</p></div></div><a href="#/news" class="lc-more">浏览最新资讯 →</a>`
    };

    app.innerHTML = `
    <!-- ═══════ 多屏滚动横幅 ═══════ -->
    <div class="banner-carousel" id="bannerCarousel">
      <div class="banner-slides">
        ${banners.map((b,i)=>`
        <div class="banner-slide ${i===0?'active':''}">
          <img src="${b.img}" alt="" loading="${i===0?'eager':'lazy'}">
          <div class="banner-overlay"></div>
          <div class="banner-content">
            <h1>${b.title}</h1>
            <p>${b.subtitle}</p>
            <div class="banner-actions">${b.cta.map(c=>`<a href="${c.h}" class="btn btn-banner">${c.t}</a>`).join('')}</div>
          </div>
        </div>`).join('')}
      </div>
      <div class="banner-dots">${banners.map((_,i)=>`<span class="banner-dot ${i===0?'active':''}" data-idx="${i}"></span>`).join('')}</div>
      <button class="banner-arrow banner-prev" aria-label="上一张">‹</button>
      <button class="banner-arrow banner-next" aria-label="下一张">›</button>
    </div>

    <!-- ═══════ 数据统计条 ═══════ -->
    <div class="stats-row new-stats">
      <div class="stat-card"><div class="stat-num"><span data-stat="theoryCourses">6</span><div class="stat-unit">门</div></div><div class="stat-label">基础理论课程</div></div>
      <div class="stat-card"><div class="stat-num"><span data-stat="practiceCourses">8</span><div class="stat-unit">门</div></div><div class="stat-label">三级实务课程</div></div>
      <div class="stat-card"><div class="stat-num"><span data-stat="questions">365</span><div class="stat-unit">道</div></div><div class="stat-label">权威题库总量</div></div>
      <div class="stat-card"><div class="stat-num">60<div class="stat-unit">分</div></div><div class="stat-label">及格线 · 单科 3 年有效</div></div>
    </div>

    <!-- ═══════ 平台简介 ═══════ -->
    <section class="intro-section">
      <div class="intro-inner">
        <h2 class="intro-title">为什么选择 CPS 备考平台？</h2>
        <div class="intro-grid">
          <div class="intro-item"><span class="intro-emoji">📚</span><div><strong><span data-stat="courses">14</span> 门系统课程</strong><small>理论 6 + 实务 8，覆盖全部考点</small></div></div>
          <div class="intro-item"><span class="intro-emoji">📝</span><div><strong><span data-stat="questions">365</span> 道权威题库</strong><small>基于指定教材编写，加权组卷</small></div></div>
          <div class="intro-item"><span class="intro-emoji">🎯</span><div><strong>AI 智能出题</strong><small>LLM 生成 + 可信溯源审核</small></div></div>
          <div class="intro-item"><span class="intro-emoji">🕸️</span><div><strong>知识图谱导航</strong><small><span data-stat="knowledgeNodes">369</span> 节点 · <span data-stat="knowledgeEdges">420</span> 边 · 可视化</small></div></div>
        </div>
      </div>
    </section>

    <!-- ═══════ 学习中心：左侧 Tab + 右侧预览 ═══════ -->
    <section class="learning-center" id="learningCenter">
      <div class="lc-header"><h2>🎓 学习中心</h2><p class="lc-subtitle">一站式备考资源，Tab 快速切换各模块</p></div>
      <div class="lc-body">
        <nav class="lc-tabs">
          <button class="lc-tab active" data-lc="theory">📚 理论课程</button>
          <button class="lc-tab" data-lc="practice">💼 实务课程</button>
          <button class="lc-tab" data-lc="knowledge">🕸️ 知识图谱</button>
          <button class="lc-tab" data-lc="practice-quiz">🃏 练习测验</button>
          <button class="lc-tab" data-lc="quiz">📝 模拟测试</button>
          <button class="lc-tab" data-lc="daily">📅 每日一练</button>
          <button class="lc-tab" data-lc="news">📰 资讯动态</button>
        </nav>
        <div class="lc-panels">
          ${Object.entries(panels).map(([k,h])=>`<div class="lc-panel ${k==='theory'?'active':''}" data-panel="${k}">${h}</div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ═══════ AI 特性 ═══════ -->
    <section class="ai-feature-section">
      <div class="ai-fs-inner">
        <div class="ai-fs-text">
          <h3>🤖 AI 智能全真模拟测试</h3>
          <p>完全模仿 CPS 三级考试的题型、题量与分值。理论科 250 题（单选 150 + 多选 50 + 判断 50），实务科 210 题（单选 140 + 多选 60 + 案例 10）。题库 <span data-stat="questions">365</span> 题覆盖全部知识点，按考试重点权重组卷——高频考点出现概率更高，每次出卷随机打乱顺序与选项。</p>
          <a href="#/quiz" class="btn btn-primary btn-lg">立即模拟测试</a>
        </div>
        <div class="ai-fs-visual">
          <div class="ai-fs-mockup">
            <div class="mockup-bar"></div>
            <div class="mockup-progress"><div class="mp-fill" style="width:68%"></div></div>
            <div class="mockup-q">Q. 42 / 250</div>
            <div class="mockup-options"><span class="mo-a active">A</span><span class="mo-b">B</span><span class="mo-c">C</span><span class="mo-d">D</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ 权威信源 ═══════ -->
    <section class="sources-section-new">
      <h2>📚 权威信源与参考资料</h2>
      <div class="src-group">
        <h3>权威机构与官方网站</h3>
        <div class="sources-grid">
          <a class="source-card" href="https://sppj.psysoc.org.cn/#/home" target="_blank" rel="noopener"><div class="src-name">中国心理学会心理咨询师水平评价工作网</div><div class="src-desc">CPS 水平评价官方报名、成绩查询、证书验证平台</div><div class="src-url">sppj.psysoc.org.cn</div></a>
          <a class="source-card" href="https://www.psysoc.org.cn/" target="_blank" rel="noopener"><div class="src-name">中国心理学会（CPS）</div><div class="src-desc">中国心理学界最高学术权威机构，证书颁发单位</div><div class="src-url">psysoc.org.cn</div></a>
          <a class="source-card" href="https://www.cpsa.org.cn/" target="_blank" rel="noopener"><div class="src-name">临床与咨询心理学专业委员会</div><div class="src-desc">专业规范、伦理准则制定机构</div><div class="src-url">cpsa.org.cn</div></a>
          <a class="source-card" href="https://www.cnki.net/" target="_blank" rel="noopener"><div class="src-name">中国知网（CNKI）</div><div class="src-desc">心理学学术论文与文献检索</div><div class="src-url">cnki.net</div></a>
        </div>
      </div>
      <div class="src-group">
        <h3>指定教材与参考书目</h3>
        <div class="sources-grid">
          <div class="source-card"><div class="src-name">《心理咨询基础培训教材·理论知识》</div><div class="src-desc">心理学综合科目唯一命题来源。涵盖导论、社会、人格、发展、异常、咨询心理学六门基础理论。</div><div class="src-url">中国心理学会指定教材</div></div>
          <div class="source-card"><div class="src-name">《心理咨询基础培训教材·咨询实务》</div><div class="src-desc">咨询实务科目命题来源。测量评估、通用技术、CBT、人本、团体、伦理、危机、实务八门。</div><div class="src-url">中国心理学会指定教材</div></div>
          <div class="source-card"><div class="src-name">《临床与咨询心理学专业机构和人员伦理守则》</div><div class="src-desc">伦理实务核心参考文件，规范保密、知情同意、双重关系等准则。</div><div class="src-url">中国心理学会发布</div></div>
          <div class="source-card"><div class="src-name">《心理咨询师水平评价规范》（2026）</div><div class="src-desc">2026 年 2 月发布，定义四级/三级/二级/一级的评价标准与考试规范。</div><div class="src-url">中国心理学会官方文件</div></div>
        </div>
      </div>
      <div class="src-group">
        <h3>权威学术数据库</h3>
        <div class="sources-grid">
          <a class="source-card" href="https://www.apa.org/" target="_blank" rel="noopener"><div class="src-name">美国心理学会（APA）</div><div class="src-desc">全球最大心理学专业组织，提供标准与循证实践指南</div><div class="src-url">apa.org</div></a>
          <a class="source-card" href="https://www.ncbi.nlm.nih.gov/pmc/" target="_blank" rel="noopener"><div class="src-name">PubMed Central</div><div class="src-desc">NIH 生物医学文献库，可检索心理咨询疗效研究</div><div class="src-url">ncbi.nlm.nih.gov/pmc</div></a>
          <a class="source-card" href="https://www.cochranelibrary.com/" target="_blank" rel="noopener"><div class="src-name">Cochrane Library</div><div class="src-desc">循证医学数据库，提供系统综述与 Meta 分析</div><div class="src-url">cochranelibrary.com</div></a>
          <a class="source-card" href="https://www.dsm5.org/" target="_blank" rel="noopener"><div class="src-name">DSM-5 诊断手册</div><div class="src-desc">精神障碍诊断标准，异常心理学重要参考</div><div class="src-url">psychiatry.org</div></a>
        </div>
      </div>
    </section>

    <!-- ═══════ 考试信息 ═══════ -->
    <section class="exam-info-section" id="exam-info">
      <h2>📋 考试信息</h2>
      <div class="exam-table-wrap">
        <table class="exam-table">
          <tbody>
            <tr><th>证书名称</th><td>中国心理学会心理咨询师水平评价 · 三级（进阶级）</td></tr>
            <tr><th>考试科目</th><td>心理学综合 + 咨询实务（两科均需 ≥ 60 分）</td></tr>
            <tr><th>命题来源</th><td>《心理咨询基础培训教材·理论知识》《心理咨询基础培训教材·咨询实务》</td></tr>
            <tr><th>考试形式</th><td>线下机考 · 全国统一命题 · 统一阅卷</td></tr>
            <tr><th>2026 年考期</th><td>第一次试点：<strong>8 月 8 日</strong> &nbsp;|&nbsp; 第二次试点：<strong>12 月 26 日</strong></td></tr>
            <tr><th>成绩有效期</th><td>单科成绩有效期 <strong>3 年</strong>，不合格可补考</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    `;

    /* 初始化横幅轮播 */
    initBannerCarousel();
    /* 初始化学习中心 Tab */
    initLearningTabs();

    /* 页面渲染后，自动调用接口拉取最新数据（课程/题库/知识节点/资讯），覆盖写死的占位数字 */
    refreshHomeData();
  }

  /* ── 首页数据自动刷新（接口驱动） ── */
  function homeCourseCard(c) {
    const type = c.type === 'practice' ? 'practice' : 'theory';
    const tag = type === 'theory' ? '理论' : '实务';
    const desc = (c.description || c.desc || '').toString();
    const short = desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
    return `<div class="course-card" onclick="location.hash='#/courses/${type}/${c.id}'">
        <div class="card-icon" style="background:${c.color || '#185FA5'};">${c.icon || '📖'}</div>
        <span class="card-tag tag-${type}">${tag}</span>
        <div class="card-title">${c.title || ''}</div>
        <div class="card-desc">${short}</div>
      </div>`;
  }

  function newsCatLabel(cat) {
    return { exam: '考试', career: '职业', research: '学术', resource: '资源' }[cat] || '资讯';
  }
  function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return (d.getMonth() + 1) + '-' + d.getDate();
  }

  async function refreshHomeData() {
    try {
      const [stats, coursesRes, newsRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()).catch(() => null),
        fetch('/api/courses').then(r => r.json()).catch(() => null),
        fetch('/api/news').then(r => r.json()).catch(() => null)
      ]);

      if (stats) {
        const setStat = (k, v) => {
          if (v === undefined || v === null) return;
          document.querySelectorAll('[data-stat="' + k + '"]').forEach(e => { e.textContent = v; });
        };
        setStat('theoryCourses', stats.theoryCourses);
        setStat('practiceCourses', stats.practiceCourses);
        setStat('courses', stats.courses);
        setStat('questions', stats.questions);
        setStat('practiceQuestions', stats.practiceQuestions);
        setStat('knowledgeNodes', stats.knowledgeNodes);
        setStat('knowledgeEdges', stats.knowledgeEdges);
      }

      if (coursesRes && Array.isArray(coursesRes.courses)) {
        const cs = coursesRes.courses;
        const theory = cs.filter(c => c.type === 'theory').slice(0, 3).map(homeCourseCard).join('');
        const practice = cs.filter(c => c.type === 'practice').slice(0, 3).map(homeCourseCard).join('');
        const tEl = document.getElementById('lcTheoryCards');
        if (tEl && theory) tEl.innerHTML = theory;
        const pEl = document.getElementById('lcPracticeCards');
        if (pEl && practice) pEl.innerHTML = practice;
      }

      if (newsRes && Array.isArray(newsRes.news)) {
        const list = document.getElementById('homeNewsList');
        if (list) {
          const items = newsRes.news.slice(0, 3).map(n => `
            <div class="news-mini-item">
              <span class="nm-cat nm-${n.category || 'research'}">${newsCatLabel(n.category)}</span>
              <a href="#/news" class="nm-title">${(n.title || '').slice(0, 38)}</a>
              <span class="nm-date">${fmtDate(n.published_at)}</span>
            </div>`).join('');
          list.innerHTML = items || '<p style="color:var(--text-secondary);font-size:14px">暂无资讯</p>';
        }
      }
    } catch (e) {
      console.warn('首页数据刷新失败（已保留静态兜底）', e);
    }
  }

  /* ── 横幅轮播逻辑 ── */
  function initBannerCarousel() {
    const el = document.getElementById('bannerCarousel');
    if (!el) return;
    const slides = el.querySelectorAll('.banner-slide');
    const dots   = el.querySelectorAll('.banner-dot');
    const prev   = el.querySelector('.banner-prev');
    const next   = el.querySelector('.banner-next');
    let idx = 0, timer;
    function go(n) {
      slides[idx].classList.remove('active'); dots[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active'); dots[idx].classList.add('active');
    }
    function nextSlide(){ go(idx+1); }
    function start(){ timer=setInterval(nextSlide,5000); }
    function stop(){ clearInterval(timer); }
    el.addEventListener('mouseenter',stop);
    el.addEventListener('mouseleave',()=>{stop();start();});
    if(next) next.addEventListener('click',()=>{stop();nextSlide();start();});
    if(prev) prev.addEventListener('click',()=>{stop();go(idx-1);start();});
    dots.forEach(d=>d.addEventListener('click',()=>{stop();go(+d.dataset.idx);start();}));
    start();
  }

  /* ── 学习中心 Tab 切换 ── */
  function initLearningTabs() {
    const tabs = document.querySelectorAll('.lc-tab');
    const pans = document.querySelectorAll('.lc-panel');
    tabs.forEach(t=>t.addEventListener('click',()=>{
      const k=t.dataset.lc;
      tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');
      pans.forEach(p=>{ p.classList.toggle('active', p.dataset.panel===k); });
    }));
  }

  function renderProfile() {
    const user = CPS_API.getCurrentUser();
    if (!user) {
      app.innerHTML = `<div style="text-align:center;padding:80px 20px"><h2>请先登录</h2><p style="margin:16px 0;color:#666">登录后可查看个人中心</p><button class="btn btn-primary" onclick="AuthUI.openModal('login')">登录</button></div>`;
      return;
    }
    app.innerHTML = `
      <div style="max-width:600px;margin:0 auto;padding:40px 20px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="width:80px;height:80px;border-radius:50%;background:#185FA5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;margin:0 auto 16px">${user.name.charAt(0).toUpperCase()}</div>
          <h2 style="font-size:24px;margin-bottom:4px">${user.name}</h2>
          <p style="color:#666">${user.email}</p>
          <span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:6px;font-size:13px;background:${user.role==='admin'?'#fde8e8':user.role==='editor'?'#fff8e8':'#e8f4fd'};color:${user.role==='admin'?'#e74c3c':user.role==='editor'?'#d4a017':'#185FA5'}">${{admin:'管理员',editor:'编辑',user:'学员'}[user.role]||user.role}</span>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:16px">
          <h3 style="font-size:18px;margin-bottom:16px">账户信息</h3>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:#666">姓名</span><span>${user.name}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:#666">邮箱</span><span>${user.email}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:#666">角色</span><span>${{admin:'管理员',editor:'编辑',user:'学员'}[user.role]||user.role}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:#666">注册时间</span><span>${user.created_at||'-'}</span></div>
        </div>
        ${CPS_API.isAdmin() ? `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:16px">
          <h3 style="font-size:18px;margin-bottom:16px">管理功能</h3>
          <a href="/admin" target="_blank" class="btn btn-primary" style="display:inline-block;margin-right:8px">⚙️ 进入管理后台</a>
        </div>
        ` : ''}
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px">
          <h3 style="font-size:18px;margin-bottom:16px">备考进度</h3>
          <p style="color:#666">登录后即可记录你的学习进度和测试成绩（功能开发中）</p>
        </div>
        <div style="text-align:center;margin-top:24px">
          <button class="btn btn-secondary" onclick="AuthUI.logout()">退出登录</button>
        </div>
      </div>
    `;
  }

  function router() {
    const hash = location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);

    QuizEngine.stop();
    if (parts[0] !== 'knowledge') {
      KnowledgeModule.destroy();
    }

    if (parts.length === 0 || parts[0] === '') {
      renderHome();
    } else if (parts[0] === 'courses') {
      if (parts.length === 1) {
        CoursesModule.renderList(app);
      } else if (parts.length >= 3) {
        CoursesModule.renderDetail(app, parts[1], parts[2]);
      } else {
        CoursesModule.renderList(app);
      }
    } else if (parts[0] === 'knowledge') {
      KnowledgeModule.render(app, parts[1]);
    } else if (parts[0] === 'practice') {
      if (parts.length >= 3) {
        PracticeModule.render(app, parts[1], parts[2]);
      } else {
        PracticeModule.render(app);
      }
    } else if (parts[0] === 'quiz') {
      QuizEngine.renderSetup(app);
    } else if (parts[0] === 'news') {
      if (parts[1]) {
        NewsModule.renderCategory(app, parts[1]);
      } else {
        NewsModule.render(app);
      }
    } else if (parts[0] === 'daily') {
      DailyModule.render(app);
    } else if (parts[0] === 'profile') {
      renderProfile();
    } else {
      renderHome();
    }

    updateActiveNav(parts[0] || 'home');
    window.scrollTo(0, 0);
  }

  function updateActiveNav(route) {
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.remove('active');
      if (a.dataset.route === route) a.classList.add('active');
    });
  }

  /* ===== 倒计时 ===== */
  function updateCountdown() {
    var now = new Date();
    var examDates = [
      { date: new Date('2026-08-08T09:00:00+08:00'), label: '8月8日试点考试' },
      { date: new Date('2026-12-26T09:00:00+08:00'), label: '12月26日试点考试' }
    ];
    var next = null;
    for (var i = 0; i < examDates.length; i++) {
      if (examDates[i].date > now) { next = examDates[i]; break; }
    }
    var labelEl = document.getElementById('cdLabel');
    var daysEl = document.getElementById('cdDays');
    if (!labelEl || !daysEl) return;
    if (!next) {
      labelEl.textContent = '考试已结束';
      daysEl.textContent = '--';
      return;
    }
    var diff = next.date - now;
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) {
      labelEl.textContent = next.label;
      daysEl.innerHTML = '<strong>' + days + '</strong>天' + hours + '时';
    } else {
      labelEl.textContent = next.label;
      daysEl.innerHTML = '<strong>' + hours + '</strong>小时';
    }
  }

  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 10) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  document.getElementById('navToggle').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('show');
  });

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', function() {
      document.querySelector('.nav-links').classList.remove('show');
    });
  });

  window.addEventListener('hashchange', router);
  updateCountdown();
  setInterval(updateCountdown, 60000);

  // 异步初始化：先加载 API 数据，再渲染页面
  async function bootstrap() {
    // 显示加载状态
    app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:400px;color:#999"><div style="text-align:center"><div style="font-size:40px;margin-bottom:12px">🧠</div><p>正在加载...</p></div></div>';

    // 初始化 API（检测后端、加载数据）
    const apiReady = await CPS_API.init();

    // 显示后端状态
    const badge = document.createElement('div');
    badge.className = 'api-status';
    badge.textContent = apiReady ? 'API ✓' : 'Static Mode';
    badge.style.color = apiReady ? '#27ae60' : '#999';
    document.body.appendChild(badge);

    // 刷新认证 UI（API 可用后才显示登录按钮等）
    AuthUI.updateUI();

    // 渲染页面
    router();
  }

  bootstrap();
})();
