/**
 * 课程模块
 * 渲染课程列表和课程详情（数据来自后端数据库 /api/courses）
 */
const CoursesModule = (function() {

  function cardHtml(c, type) {
    const tag = type === 'theory' ? '理论课程' : '实务课程';
    const tagClass = type === 'theory' ? 'tag-theory' : 'tag-practice';
    const desc = (c.description || c.desc || '').toString();
    const ch = (c.content || c.chapters || []).length;
    return `
      <div class="course-card" onclick="location.hash='#/courses/${type}/${c.id}'">
        <div class="card-icon" style="background:${c.color};">${c.icon}</div>
        <span class="card-tag ${tagClass}">${tag}</span>
        <div class="card-title">${c.title}</div>
        <div class="card-desc">${desc}</div>
        <div class="card-meta"><span>${ch} 章</span></div>
      </div>`;
  }

  async function renderList(app) {
    app.innerHTML = `
      <div>
        <div class="section-header"><h2>课程中心</h2></div>
        <p style="color:var(--text-secondary);margin-bottom:32px;font-size:15px;">正在加载课程...</p>
      </div>`;

    let courses = [];
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      courses = data.courses || [];
    } catch (e) {
      // 兜底：后端不可用时使用静态数据
      if (typeof THEORY_COURSES !== 'undefined') courses = courses.concat(THEORY_COURSES.map(c => ({ ...c, type: 'theory' })));
      if (typeof PRACTICE_COURSES !== 'undefined') courses = courses.concat(PRACTICE_COURSES.map(c => ({ ...c, type: 'practice' })));
    }

    const theory = courses.filter(c => c.type === 'theory');
    const practice = courses.filter(c => c.type === 'practice');
    const theoryCards = theory.map(c => cardHtml(c, 'theory')).join('');
    const practiceCards = practice.map(c => cardHtml(c, 'practice')).join('');

    app.innerHTML = `
      <div>
        <div class="section-header"><h2>课程中心</h2></div>
        <p style="color:var(--text-secondary);margin-bottom:32px;font-size:15px;">
          基于《心理咨询基础培训教材》编写，覆盖 CPS 三级考试全部课程内容。
        </p>

        <div class="section">
          <div class="section-header">
            <h2>基础理论课程（${theory.length}门）</h2>
            <span style="font-size:14px;color:var(--secondary);font-weight:500;">对应心理学综合科目</span>
          </div>
          <div class="course-grid">${theoryCards}</div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>三级实务课程（${practice.length}门）</h2>
            <span style="font-size:14px;color:var(--primary);font-weight:500;">对应咨询实务科目</span>
          </div>
          <div class="course-grid">${practiceCards}</div>
        </div>
      </div>`;
  }

  async function renderDetail(app, tag, courseId) {
    app.innerHTML = '<div style="text-align:center;padding:60px;color:#999">加载中...</div>';

    let course = null;
    try {
      const res = await fetch('/api/courses/' + courseId);
      const data = await res.json();
      course = data.course;
    } catch (e) { /* 尝试静态兜底 */ }

    if (!course) {
      const pool = tag === 'theory'
        ? (typeof THEORY_COURSES !== 'undefined' ? THEORY_COURSES : [])
        : (typeof PRACTICE_COURSES !== 'undefined' ? PRACTICE_COURSES : []);
      course = pool.find(c => c.id === courseId);
    }
    if (!course) {
      app.innerHTML = '<p>课程未找到</p>';
      return;
    }

    const type = (course.type === 'practice' || tag === 'practice') ? 'practice' : 'theory';
    const tagLabel = type === 'theory' ? '理论课程' : '实务课程';
    const tagClass = type === 'theory' ? 'tag-theory' : 'tag-practice';
    const chapters = course.content || course.chapters || [];

    var tocHtml = '<div class="course-toc"><h4>课程大纲</h4>';
    chapters.forEach(function(ch, ci) {
      tocHtml += '<a href="javascript:void(0)" data-toc="' + ci + '">' + (ci + 1) + '. ' + ch.title + '</a>';
    });
    tocHtml += '</div>';

    var chaptersHtml = chapters.map(function(ch, ci) {
      var sectionsHtml = (ch.sections || []).map(function(sec) {
        if (sec.keyPoint) {
          return '<div class="key-point"><p>' + sec.p + '</p></div>';
        }
        if (sec.infoBox) {
          return '<div class="info-box"><p>' + sec.p + '</p></div>';
        }
        var html = '';
        if (sec.h) html += '<h4>' + sec.h + '</h4>';
        if (sec.p) html += '<p>' + sec.p + '</p>';
        if (sec.list) {
          html += '<ul>';
          sec.list.forEach(function(item) { html += '<li>' + item + '</li>'; });
          html += '</ul>';
        }
        return html;
      }).join('');

      return '<div class="chapter" id="ch' + ci + '">' +
        '<h3>第' + (ci + 1) + '章 ' + ch.title + '</h3>' +
        sectionsHtml +
        '</div>';
    }).join('');

    app.innerHTML =
      '<div class="breadcrumb">' +
        '<a href="#/">首页</a> / <a href="#/courses">课程中心</a> / <span>' + course.title + '</span>' +
      '</div>' +
      '<div class="course-layout">' +
        tocHtml +
        '<div class="course-detail-content">' +
          '<h1 style="font-size:2rem;font-weight:700;margin-bottom:8px;color:var(--gray-800);">' + course.title + '</h1>' +
          '<p class="subtitle" style="font-size:16px;color:var(--text-secondary);margin-bottom:32px;">' +
            '<span class="card-tag ' + tagClass + '">' + tagLabel + '</span> ' +
            (course.description || course.desc || '') +
          '</p>' +
          chaptersHtml +
          '<div style="margin-top:32px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">' +
            '<a href="#/courses" class="btn btn-outline">返回课程列表</a>' +
            '<a href="#/practice/' + type + '/' + courseId + '" class="btn btn-secondary">练习测验</a>' +
            '<a href="#/quiz" class="btn btn-primary">前往模拟测试</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* TOC 链接：平滑滚动到对应章节，避免触发哈希路由 */
    document.querySelectorAll('[data-toc]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var ci = this.getAttribute('data-toc');
        var el = document.getElementById('ch' + ci);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelectorAll('.course-toc a').forEach(function(a) { a.classList.remove('active'); });
          this.classList.add('active');
        }
      });
    });
  }

  return { renderList, renderDetail };
})();
