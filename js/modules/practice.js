/**
 * CPS三级备考平台 · 练习测验模块
 * 翻转卡片式练习，按课程/主题分类
 */
var PracticeModule = (function() {
  var state = { courseFilter: null, topicFilter: null, currentTopic: null, currentIdx: 0, flipped: false, answered: {} };

  function render(app, courseTag, courseId) {
    state.courseFilter = courseId || null;
    state.topicFilter = null;
    state.currentTopic = null;
    state.courseTag = courseTag || null;
    state.courseId = courseId || null;
    app.innerHTML = '';

    var container = document.createElement('div');
    container.className = 'practice-page';
    app.appendChild(container);

    renderHeader(container, courseTag, courseId);

    if (courseId && courseTag) {
      renderTopics(container, courseTag, courseId);
    } else {
      renderCourseSelector(container);
    }
  }

  function renderHeader(container, courseTag, courseId) {
    var title = '练习测验';
    var subtitle = '按课程章节分类组织，翻转卡片式学习——正面答题，翻面看详细解析';
    if (courseId && courseTag) {
      var courses = courseTag === 'theory' ? THEORY_COURSES : PRACTICE_COURSES;
      var course = courses.find(function(c) { return c.id === courseId; });
      if (course) {
        title = course.title + ' · 练习';
        subtitle = '点击卡片翻面查看答案与解析';
      }
    }
    container.innerHTML = '<div class="practice-header"><h2>' + title + '</h2><p>' + subtitle + '</p></div>';
  }

  function renderCourseSelector(container) {
    var html = '<div class="practice-sections"><div class="practice-section"><h3 class="ps-title">基础理论课程（6门）</h3><div class="practice-courses-grid">';

    THEORY_COURSES.forEach(function(c) {
      var topics = getTopicsForCourse('theory', c.id);
      var qCount = topics.reduce(function(s, t) { return s + t.questions.length; }, 0);
      html += '<div class="practice-course-card" onclick="location.hash=\'#/practice/theory/' + c.id + '\'">' +
        '<div class="pcc-icon" style="background:' + c.color + ';">' + c.icon + '</div>' +
        '<div class="pcc-info"><div class="pcc-title">' + c.title + '</div>' +
        '<div class="pcc-meta">' + topics.length + '个主题 · ' + qCount + '道题</div></div>' +
        '<span class="pcc-arrow">→</span></div>';
    });

    html += '</div></div><div class="practice-section"><h3 class="ps-title">三级实务课程（8门）</h3><div class="practice-courses-grid">';

    PRACTICE_COURSES.forEach(function(c) {
      var topics = getTopicsForCourse('practice', c.id);
      var qCount = topics.reduce(function(s, t) { return s + t.questions.length; }, 0);
      html += '<div class="practice-course-card" onclick="location.hash=\'#/practice/practice/' + c.id + '\'">' +
        '<div class="pcc-icon" style="background:' + c.color + ';">' + c.icon + '</div>' +
        '<div class="pcc-info"><div class="pcc-title">' + c.title + '</div>' +
        '<div class="pcc-meta">' + topics.length + '个主题 · ' + qCount + '道题</div></div>' +
        '<span class="pcc-arrow">→</span></div>';
    });

    html += '</div></div></div>';
    container.innerHTML += html;
  }

  function getTopicsForCourse(tag, courseId) {
    var entry = PRACTICE_CARDS.find(function(c) { return c.courseId === courseId; });
    return entry ? entry.topics : [];
  }

  function renderTopics(container, courseTag, courseId) {
    var topics = getTopicsForCourse(courseTag, courseId);
    if (!topics.length) {
      container.innerHTML += '<p class="no-data">暂无练习题</p>';
      return;
    }

    var courseEntry = PRACTICE_CARDS.find(function(c) { return c.courseId === courseId; });
    var courseTitle = courseEntry ? courseEntry.courseTitle : '';
    var courseColor = courseEntry ? courseEntry.courseColor : '#185FA5';

    var html = '<div class="practice-topics"><div class="topics-grid">';
    topics.forEach(function(t, ti) {
      html += '<div class="topic-card" data-topic-idx="' + ti + '">' +
        '<div class="topic-card-header" style="border-left-color:' + courseColor + ';">' +
        '<span class="topic-chapter">' + (t.chapter || '') + '</span>' +
        '<h4>' + t.topicTitle + '</h4></div>' +
        '<div class="topic-card-body">' +
        '<span class="topic-q-count">' + t.questions.length + '道题</span>' +
        '<button class="btn-start-topic" data-topic-idx="' + ti + '">开始练习</button></div></div>';
    });
    html += '</div></div>';
    container.innerHTML += html;

    container.querySelectorAll('.btn-start-topic').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.dataset.topicIdx);
        startTopic(container, topics, idx, courseTitle, courseColor);
      });
    });
  }

  function startTopic(container, topics, topicIdx, courseTitle, courseColor) {
    state.currentTopic = topics[topicIdx];
    state.currentIdx = 0;
    state.flipped = false;
    state.answered = {};

    renderCardView(container, topics, topicIdx, courseTitle, courseColor);
  }

  function renderCardView(container, topics, topicIdx, courseTitle, courseColor) {
    var topic = topics[topicIdx];
    var total = topic.questions.length;
    var q = topic.questions[state.currentIdx];

    var progress = '';
    for (var i = 0; i < total; i++) {
      var cls = 'prog-dot';
      if (i < state.currentIdx) cls += ' done';
      else if (i === state.currentIdx) cls += ' current';
      progress += '<span class="' + cls + '"></span>';
    }

    var html = '<div class="flashcard-view">' +
      '<div class="fc-breadcrumb">' +
        '<a href="#/practice">练习测验</a> > ' +
        '<a href="#/practice/' + (state.courseTag || '') + '/' + (state.courseId || '') + '">' + courseTitle + '</a> > ' +
        '<span>' + topic.topicTitle + '</span>' +
      '</div>' +
      '<div class="fc-progress">' + progress + '<span class="prog-text">' + (state.currentIdx + 1) + ' / ' + total + '</span></div>' +
      '<div class="fc-card-container">' +
        '<div class="flashcard' + (state.flipped ? ' flipped' : '') + '" id="flashcard">' +
          '<div class="fc-front" style="border-top:4px solid ' + courseColor + ';">' +
            renderFront(q, state.currentIdx) +
          '</div>' +
          '<div class="fc-back" style="border-top:4px solid ' + courseColor + ';">' +
            renderBack(q) +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="fc-controls">' +
        '<button class="fc-btn fc-btn-prev" ' + (state.currentIdx === 0 ? 'disabled' : '') + ' id="fcPrev">← 上一题</button>' +
        '<button class="fc-btn fc-btn-flip" id="fcFlip">' + (state.flipped ? '查看题目' : '查看答案') + '</button>' +
        '<button class="fc-btn fc-btn-next" ' + (state.currentIdx === total - 1 ? 'disabled' : '') + ' id="fcNext">下一题 →</button>' +
      '</div>' +
      '<div class="fc-topic-nav">' +
        '<button class="fc-back-topics" id="fcBackTopics">← 返回主题列表</button>' +
        '<span class="fc-topic-name">' + topic.topicTitle + '</span>' +
      '</div>' +
    '</div>';

    container.innerHTML = html;

    /* 动态调整卡片高度，防止内容溢出覆盖控制按钮 */
    adjustCardHeight();

    document.getElementById('fcFlip').addEventListener('click', function() {
      state.flipped = !state.flipped;
      var card = document.getElementById('flashcard');
      if (state.flipped) card.classList.add('flipped');
      else card.classList.remove('flipped');
      this.textContent = state.flipped ? '查看题目' : '查看答案';
    });

    document.getElementById('fcPrev').addEventListener('click', function() {
      if (state.currentIdx > 0) {
        state.currentIdx--;
        state.flipped = false;
        renderCardView(container, topics, topicIdx, courseTitle, courseColor);
      }
    });

    document.getElementById('fcNext').addEventListener('click', function() {
      if (state.currentIdx < total - 1) {
        state.currentIdx++;
        state.flipped = false;
        renderCardView(container, topics, topicIdx, courseTitle, courseColor);
      }
    });

    document.getElementById('fcBackTopics').addEventListener('click', function() {
      state.currentTopic = null;
      if (state.courseTag && state.courseId) {
        container.innerHTML = '';
        renderHeader(container, state.courseTag, state.courseId);
        renderTopics(container, state.courseTag, state.courseId);
      } else {
        render(document.getElementById('app'));
      }
    });

    /* 选项点击事件 */
    container.querySelectorAll('.fc-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        if (state.flipped) return;
        var selected = opt.dataset.option;
        var correct = q.answer;
        container.querySelectorAll('.fc-option').forEach(function(o) { o.classList.remove('selected', 'correct', 'wrong'); });
        if (selected === correct) {
          opt.classList.add('selected', 'correct');
        } else {
          opt.classList.add('selected', 'wrong');
          container.querySelectorAll('.fc-option').forEach(function(o) {
            if (o.dataset.option === correct) o.classList.add('correct');
          });
        }
        /* 答题后自动提示翻面 */
        var flipBtn = document.getElementById('fcFlip');
        if (flipBtn && !state.flipped) {
          flipBtn.style.animation = 'pulse 0.6s ease 3';
        }
      });
    });
  }

  function getCourseTitle(topic) {
    return topic.topicTitle || '';
  }

  function renderFront(q, idx) {
    var html = '<div class="fc-q-meta"><span class="fc-q-num">第 ' + (idx + 1) + ' 题</span>';
    if (q.type === 'judge') html += '<span class="fc-q-type type-judge">判断题</span>';
    else html += '<span class="fc-q-type type-choice">选择题</span>';
    html += '<span class="fc-q-src">' + (q.src || '') + '</span></div>';
    html += '<div class="fc-q-text">' + q.q + '</div>';

    if (q.type === 'judge') {
      html += '<div class="fc-options fc-judge"><div class="fc-option" data-option="对">✓ 正确</div><div class="fc-option" data-option="错">✗ 错误</div></div>';
    } else if (q.options) {
      html += '<div class="fc-options">';
      q.options.forEach(function(opt) {
        var letter = opt.charAt(0);
        html += '<div class="fc-option" data-option="' + letter + '"><span class="opt-letter">' + letter + '</span><span class="opt-text">' + opt.substring(3) + '</span></div>';
      });
      html += '</div>';
    }

    html += '<div class="fc-hint">选择答案后，点击"查看答案"翻面对比解析</div>';
    return html;
  }

  function renderBack(q) {
    var html = '<div class="fc-q-meta"><span class="fc-q-num">答案与解析</span></div>';
    html += '<div class="fc-answer-box"><span class="fc-answer-label">正确答案</span><span class="fc-answer-value">' + q.answer + '</span></div>';
    html += '<div class="fc-exp-box"><div class="fc-exp-label">详细解析</div><p class="fc-exp-text">' + (q.exp || '') + '</p></div>';
    if (q.src) html += '<div class="fc-source">来源：' + q.src + '</div>';
    html += '<div class="fc-back-hint">点击"查看题目"返回正面 · 点击"下一题"继续</div>';
    return html;
  }

  /* 动态调整卡片高度，取正面和背面中较高的值，防止内容溢出覆盖控制按钮 */
  function adjustCardHeight() {
    var card = document.getElementById('flashcard');
    if (!card) return;
    var front = card.querySelector('.fc-front');
    var back = card.querySelector('.fc-back');
    if (!front || !back) return;

    /* 临时切换为 static 定位来测量真实内容高度 */
    var frontSaved = front.style.cssText;
    var backSaved = back.style.cssText;

    front.style.cssText = 'position:static;visibility:hidden;transform:none;backface-visibility:visible;';
    var frontH = front.offsetHeight;

    back.style.cssText = 'position:static;visibility:hidden;transform:none;backface-visibility:visible;';
    var backH = back.offsetHeight;

    front.style.cssText = frontSaved;
    back.style.cssText = backSaved;

    card.style.minHeight = Math.max(frontH, backH, 360) + 'px';
  }

  return { render: render };
})();
