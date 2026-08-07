/**
 * 知识检索模块
 * 全文搜索课程内容和题库
 */
const SearchModule = (function() {

  function buildIndex() {
    const index = [];
    // 索引理论课程
    THEORY_COURSES.forEach(course => {
      course.chapters.forEach(chapter => {
        chapter.sections.forEach(section => {
          let text = '';
          if (section.p) text += section.p;
          if (section.h) text += ' ' + section.h;
          if (section.list) text += ' ' + section.list.join(' ');
          index.push({
            type: 'theory',
            typeLabel: '理论课程',
            courseId: course.id,
            courseTitle: course.title,
            chapterTitle: chapter.title,
            title: section.h || chapter.title,
            snippet: text.substring(0, 200),
            fullText: text,
            url: '#/courses/theory/' + course.id
          });
        });
      });
    });
    // 索引实务课程
    PRACTICE_COURSES.forEach(course => {
      course.chapters.forEach(chapter => {
        chapter.sections.forEach(section => {
          let text = '';
          if (section.p) text += section.p;
          if (section.h) text += ' ' + section.h;
          if (section.list) text += ' ' + section.list.join(' ');
          index.push({
            type: 'practice',
            typeLabel: '实务课程',
            courseId: course.id,
            courseTitle: course.title,
            chapterTitle: chapter.title,
            title: section.h || chapter.title,
            snippet: text.substring(0, 200),
            fullText: text,
            url: '#/courses/practice/' + course.id
          });
        });
      });
    });
    // 索引题库
    const allQs = [
      ...QUESTION_BANK.theory_single.map(q => ({...q, cat:'theory_single', catLabel:'理论·单选'})),
      ...QUESTION_BANK.theory_multiple.map(q => ({...q, cat:'theory_multiple', catLabel:'理论·多选'})),
      ...QUESTION_BANK.theory_judge.map(q => ({...q, cat:'theory_judge', catLabel:'理论·判断'})),
      ...QUESTION_BANK.practice_single.map(q => ({...q, cat:'practice_single', catLabel:'实务·单选'})),
      ...QUESTION_BANK.practice_multiple.map(q => ({...q, cat:'practice_multiple', catLabel:'实务·多选'})),
      ...QUESTION_BANK.practice_case.map(q => ({...q, cat:'practice_case', catLabel:'实务·案例'})),
    ];
    allQs.forEach(q => {
      index.push({
        type: 'question',
        typeLabel: '题库·' + q.catLabel,
        courseId: '',
        courseTitle: q.src || '',
        chapterTitle: '',
        title: q.q.substring(0, 60),
        snippet: q.q + ' | ' + (q.options || []).join(' '),
        fullText: q.q + ' ' + (q.options || []).join(' ') + ' ' + (q.exp || ''),
        url: '#/quiz'
      });
    });
    return index;
  }

  let cachedIndex = null;

  function getIndex() {
    if (!cachedIndex) cachedIndex = buildIndex();
    return cachedIndex;
  }

  function search(query, filter) {
    if (!query || query.trim().length < 1) return [];
    const idx = getIndex();
    const q = query.trim().toLowerCase();
    let results = idx.filter(item => {
      if (filter && filter !== 'all' && item.type !== filter) return false;
      return item.fullText.toLowerCase().includes(q);
    });
    return results.slice(0, 50);
  }

  function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), m => '<span class="highlight">' + m + '</span>');
  }

  function render(app) {
    let currentFilter = 'all';
    let currentQuery = '';

    function doSearch() {
      const input = document.getElementById('searchInput');
      const val = input ? input.value : '';
      currentQuery = val;
      const results = search(val, currentFilter);
      const container = document.getElementById('searchResults');
      if (!container) return;

      if (!val.trim()) {
        container.innerHTML = '<div class="no-results"><p>输入关键词搜索课程内容、知识点和题库</p><p style="margin-top:12px;font-size:13px;">支持搜索：心理学导论、社会心理学、人格心理学、发展心理学、异常心理学、咨询心理学、CBT、伦理、危机干预等</p></div>';
        return;
      }

      if (results.length === 0) {
        container.innerHTML = '<div class="no-results"><p>未找到与"' + val + '"相关的内容</p><p style="margin-top:8px;font-size:13px;">试试其他关键词？</p></div>';
        return;
      }

      container.innerHTML = results.map(r => {
        const snippet = r.snippet.substring(0, 150) + '...';
        return '<div class="search-result-item" onclick="location.hash=\'' + r.url + '\'">' +
          '<div class="result-type">' + r.typeLabel + (r.courseTitle ? ' · ' + r.courseTitle : '') + '</div>' +
          '<div class="result-title">' + highlight(r.title, currentQuery) + '</div>' +
          '<div class="result-snippet">' + highlight(snippet, currentQuery) + '</div>' +
          '</div>';
      }).join('');
    }

    app.innerHTML = `
      <div class="search-page">
        <div class="section-header"><h2>知识检索</h2></div>
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="搜索课程内容、知识点、题库..." autocomplete="off">
        </div>
        <div class="search-filters">
          <div class="filter-chip active" data-filter="all">全部</div>
          <div class="filter-chip" data-filter="theory">理论课程</div>
          <div class="filter-chip" data-filter="practice">实务课程</div>
          <div class="filter-chip" data-filter="question">题库</div>
        </div>
        <div class="search-results" id="searchResults">
          <div class="no-results">
            <p>输入关键词搜索课程内容、知识点和题库</p>
            <p style="margin-top:12px;font-size:13px;">支持搜索：心理学导论、社会心理学、人格心理学、发展心理学、异常心理学、咨询心理学、CBT、伦理、危机干预等</p>
          </div>
        </div>
      </div>
    `;

    const input = document.getElementById('searchInput');
    let debounceTimer;
    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSearch, 200);
    });

    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        doSearch();
      });
    });
  }

  return { render, search };
})();
