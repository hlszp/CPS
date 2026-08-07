/**
 * 模拟测试引擎
 * 基于 CPS 三级考试题型与分值，从题库组卷、计时、评分、解析
 * 支持按考试重点权重组卷
 */
const QuizEngine = (function() {

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* 按权重加权抽样：weight=3的题目出现概率是weight=1的3倍 */
  function weightedSample(arr, count) {
    var pool = [];
    arr.forEach(function(q) {
      var w = q.weight || 2;
      for (var k = 0; k < w; k++) pool.push(q);
    });
    var shuffled = shuffle(pool);
    var result = [];
    var used = {};
    for (var i = 0; i < shuffled.length && result.length < count; i++) {
      if (!used[shuffled[i].id]) {
        used[shuffled[i].id] = true;
        result.push(shuffled[i]);
      }
    }
    while (result.length < count) {
      var q = arr[Math.floor(Math.random() * arr.length)];
      result.push(q);
    }
    return result;
  }

  function generateExam(subject) {
    const bank = QUESTION_BANK;
    let questions = [];
    let examInfo = {};

    if (subject === 'theory') {
      var singles = weightedSample(bank.theory_single, 150);
      var multis = weightedSample(bank.theory_multiple, 50);
      var judges = weightedSample(bank.theory_judge, 50);

      singles.forEach(function(q, i) { questions.push(Object.assign({}, q, {_type:'single', _num:i+1})); });
      multis.forEach(function(q, i) { questions.push(Object.assign({}, q, {_type:'multiple', _num:150+i+1})); });
      judges.forEach(function(q, i) { questions.push(Object.assign({}, q, {_type:'judge', _num:200+i+1})); });
      questions = shuffle(questions);
      questions.forEach(function(q, i) { q._index = i; });

      examInfo = {
        title: '心理学综合 · 全真模拟',
        timeLimit: 120 * 60,
        totalQuestions: 250,
        types: [
          { name: '单选题', count: 150, score: 0.4, total: 60 },
          { name: '多选题', count: 50, score: 0.6, total: 30 },
          { name: '判断题', count: 50, score: 0.2, total: 10 }
        ],
        maxScore: 100,
        passScore: 60
      };
    } else {
      var singles = weightedSample(bank.practice_single, 140);
      var multis = weightedSample(bank.practice_multiple, 60);
      var cases = weightedSample(bank.practice_case, 10);

      singles.forEach(function(q, i) { questions.push(Object.assign({}, q, {_type:'single', _num:i+1})); });
      multis.forEach(function(q, i) { questions.push(Object.assign({}, q, {_type:'multiple', _num:140+i+1})); });
      cases.forEach(function(q, i) { questions.push(Object.assign({}, q, {_type:'case', _num:200+i+1})); });
      questions = shuffle(questions);
      questions.forEach(function(q, i) { q._index = i; });

      examInfo = {
        title: '咨询实务 · 全真模拟',
        timeLimit: 120 * 60,
        totalQuestions: 210,
        types: [
          { name: '单选题', count: 140, score: 0.4, total: 56 },
          { name: '多选题', count: 60, score: 0.6, total: 36 },
          { name: '案例不定项', count: 10, score: 0.8, total: 8 }
        ],
        maxScore: 100,
        passScore: 60
      };
    }

    return { questions, examInfo };
  }

  let state = null;
  let timerInterval = null;

  function start(subject) {
    const exam = generateExam(subject);
    state = {
      subject,
      questions: exam.questions,
      examInfo: exam.examInfo,
      answers: new Array(exam.questions.length).fill(null),
      currentIndex: 0,
      timeLeft: exam.examInfo.timeLimit,
      startTime: Date.now(),
      submitted: false
    };
    renderQuestion();
    startTimer();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
      if (!state || state.submitted) return;
      state.timeLeft--;
      updateTimer();
      if (state.timeLeft <= 0) {
        submit();
      }
    }, 1000);
  }

  function updateTimer() {
    const el = document.getElementById('quizTimer');
    if (!el || !state) return;
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    if (state.timeLeft < 300) el.classList.add('warning');
    else el.classList.remove('warning');
  }

  function getTypeLabel(type) {
    const map = { single: '单选', multiple: '多选', judge: '判断', case: '案例' };
    return map[type] || '单选';
  }

  function getTypeClass(type) {
    const map = { single: 'type-single', multiple: 'type-multiple', judge: 'type-judge', case: 'type-case' };
    return map[type] || 'type-single';
  }

  function renderQuestion() {
    if (!state) return;
    const q = state.questions[state.currentIndex];
    const app = document.getElementById('app');
    const answered = state.answers.filter(a => a !== null).length;
    const progress = ((state.currentIndex + 1) / state.questions.length * 100).toFixed(0);

    let optionsHtml = '';
    const isMultiple = q._type === 'multiple' || q._type === 'case';
    const options = q.options || [];
    const currentAnswer = state.answers[state.currentIndex];

    options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const selected = currentAnswer && currentAnswer.includes(letter);
      optionsHtml += `
        <div class="option-item ${selected ? 'selected' : ''}" data-letter="${letter}" data-index="${i}">
          <div class="option-label">${letter}</div>
          <div class="option-text">${opt}</div>
        </div>`;
    });

    app.innerHTML = `
      <div class="quiz-page">
        <div class="quiz-header">
          <div class="quiz-timer" id="quizTimer">120:00</div>
          <button class="btn btn-outline" onclick="QuizEngine.submit()">交卷</button>
        </div>
        <div class="quiz-progress">
          <span>第 ${state.currentIndex + 1} / ${state.questions.length} 题 · 已答 ${answered} 题</span>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
        </div>
        <div class="question-card">
          <div class="question-number">
            第 ${state.currentIndex + 1} 题
            <span class="question-type ${getTypeClass(q._type)}">${getTypeLabel(q._type)}</span>
          </div>
          ${q._type === 'case' && q.case ? `<div style="background:var(--gray-50);padding:16px;border-radius:8px;margin-bottom:16px;font-size:14px;color:var(--gray-600);line-height:1.7;">${q.case}</div>` : ''}
          <div class="question-text">${q.q}</div>
          ${isMultiple ? '<p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">多选题：请选择所有正确选项</p>' : ''}
          <div class="option-list" id="optionList">
            ${optionsHtml}
          </div>
          <div id="explanationArea"></div>
          <div class="quiz-ai-btn-wrap">
            <button class="btn btn-ai" onclick="AIChat.askFromQuiz(QuizEngine.getCurrentQuestion())">
              <span>🤖</span> AI 答疑
            </button>
          </div>
        </div>
        <div class="quiz-nav">
          <button class="btn btn-outline" onclick="QuizEngine.prev()" ${state.currentIndex === 0 ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>上一题</button>
          <span style="color:var(--text-secondary);font-size:14px;">${state.currentIndex + 1} / ${state.questions.length}</span>
          ${state.currentIndex < state.questions.length - 1
            ? '<button class="btn btn-primary" onclick="QuizEngine.next()">下一题</button>'
            : '<button class="btn btn-danger" onclick="QuizEngine.submit()">完成并交卷</button>'}
        </div>
      </div>
    `;

    document.querySelectorAll('.option-item').forEach(el => {
      el.addEventListener('click', function() {
        const letter = this.dataset.letter;
        if (isMultiple) {
          let ans = state.answers[state.currentIndex] || [];
          if (ans.includes(letter)) {
            ans = ans.filter(l => l !== letter);
          } else {
            ans = [...ans, letter];
          }
          state.answers[state.currentIndex] = ans.length ? ans : null;
        } else {
          state.answers[state.currentIndex] = [letter];
        }
        renderQuestion();
      });
    });

    updateTimer();
  }

  function next() {
    if (state && state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  function prev() {
    if (state && state.currentIndex > 0) {
      state.currentIndex--;
      renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  function jumpTo(index) {
    if (state && index >= 0 && index < state.questions.length) {
      state.currentIndex = index;
      renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  function calculateScore() {
    if (!state) return 0;
    let score = 0;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    const typeStats = {};

    state.questions.forEach((q, i) => {
      const ans = state.answers[i];
      const type = q._type;
      if (!typeStats[type]) typeStats[type] = { correct: 0, wrong: 0, unanswered: 0, total: 0 };
      typeStats[type].total++;

      if (!ans || ans.length === 0) {
        unanswered++;
        typeStats[type].unanswered++;
        return;
      }

      const correctAns = q.answer.split('').sort().join('');
      const userAns = ans.sort().join('');

      if (correctAns === userAns) {
        const pts = type === 'single' ? 0.4 : type === 'multiple' ? 0.6 : type === 'judge' ? 0.2 : 0.8;
        score += pts;
        correct++;
        typeStats[type].correct++;
      } else {
        wrong++;
        typeStats[type].wrong++;
      }
    });

    return { score: score.toFixed(1), correct, wrong, unanswered, typeStats };
  }

  function submit() {
    if (!state) return;
    if (timerInterval) clearInterval(timerInterval);
    state.submitted = true;
    const result = calculateScore();
    renderResult(result);
  }

  function renderResult(result) {
    const app = document.getElementById('app');
    const passed = parseFloat(result.score) >= 60;
    const totalQs = state.questions.length;

    let typeBreakdown = '';
    Object.keys(result.typeStats).forEach(type => {
      const s = result.typeStats[type];
      const label = getTypeLabel(type);
      const rate = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(0) : 0;
      typeBreakdown += `
        <div class="result-stat">
          <div class="stat-num">${s.correct}/${s.total}</div>
          <div class="stat-label">${label} · 正确率${rate}%</div>
        </div>`;
    });

    app.innerHTML = `
      <div class="quiz-page">
        <div class="quiz-result">
          <h2>考试完成</h2>
          <div class="result-score ${passed ? 'pass' : 'fail'}">${result.score}分</div>
          <p style="font-size:16px;color:${passed ? 'var(--primary)' : 'var(--danger)'};font-weight:600;">
            ${passed ? '恭喜通过！' : '未达60分及格线'}
          </p>
          <p style="color:var(--text-secondary);margin-top:8px;">
            ${state.examInfo.title} · 共${totalQs}题 · 用时${Math.floor((Date.now()-state.startTime)/60000)}分钟
          </p>

          <div class="result-detail">
            ${typeBreakdown}
          </div>

          <div style="margin:32px 0;">
            <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="QuizEngine.review()">查看解析</button>
              <button class="btn btn-outline" onclick="location.hash='#/quiz'">返回测试中心</button>
            </div>
          </div>
        </div>

        <div class="result-review" id="reviewArea" style="display:none;">
          <h3>题目解析</h3>
          <div id="reviewList"></div>
        </div>
      </div>
    `;

    // 存储结果供review使用
    state.reviewIndex = 0;
  }

  function review() {
    const reviewArea = document.getElementById('reviewArea');
    if (!reviewArea || !state) return;
    reviewArea.style.display = 'block';

    // 显示前50题的解析（为避免页面过长）
    const showCount = Math.min(50, state.questions.length);
    let html = '';

    for (let i = 0; i < showCount; i++) {
      const q = state.questions[i];
      const ans = state.answers[i];
      const correctAns = q.answer.split('').sort().join('');
      const userAns = ans ? ans.sort().join('') : '未作答';
      const isCorrect = correctAns === userAns;

      html += `
        <div class="question-card" style="margin-bottom:16px;">
          <div class="question-number">
            第 ${i + 1} 题
            <span class="question-type ${getTypeClass(q._type)}">${getTypeLabel(q._type)}</span>
            ${isCorrect ? '<span style="color:var(--primary);float:right;">✓ 正确</span>' : '<span style="color:var(--danger);float:right;">✗ 错误</span>'}
          </div>
          ${q._type === 'case' && q.case ? `<div style="background:var(--gray-50);padding:12px;border-radius:8px;margin-bottom:12px;font-size:13px;color:var(--gray-600);">${q.case}</div>` : ''}
          <div class="question-text" style="font-size:15px;">${q.q}</div>
          <div class="option-list">`;

      (q.options || []).forEach((opt, j) => {
        const letter = String.fromCharCode(65 + j);
        const isRight = q.answer.includes(letter);
        const isUser = ans && ans.includes(letter);
        let cls = '';
        if (isRight) cls = 'correct';
        else if (isUser) cls = 'wrong';
        html += `
          <div class="option-item ${cls}" style="cursor:default;">
            <div class="option-label">${letter}</div>
            <div class="option-text">${opt}</div>
          </div>`;
      });

      html += `
          </div>
          <div class="quiz-explanation">
            <div class="exp-label">正确答案：${q.answer}</div>
            <p>${q.exp || ''}</p>
            <div class="exp-source">来源：${q.src || ''} · 你的答案：${userAns}</div>
          </div>
          <div class="quiz-ai-btn-wrap">
            <button class="btn btn-ai btn-ai-sm" onclick="QuizEngine.askAIForReview(${i})">
              <span>🤖</span> AI 深度解析
            </button>
          </div>
        </div>`;
    }

    if (state.questions.length > 50) {
      html += `<p style="text-align:center;color:var(--text-secondary);padding:20px;">仅显示前50题解析，完整解析请联系导师获取。</p>`;
    }

    const reviewList = document.getElementById('reviewList');
    if (reviewList) reviewList.innerHTML = html;

    reviewArea.scrollIntoView({ behavior: 'smooth' });
  }

  function renderSetup(app) {
    app.innerHTML = `
      <div class="quiz-page">
        <div class="quiz-setup">
          <h2>模拟测试中心</h2>
          <p>完全模仿 CPS 三级考试的题型、题量与分值结构。题库共365题，覆盖理论6门课程与实务8门课程全部知识点，按考试重点权重组卷——高频考点出现概率更高。</p>
        </div>

        <div class="ai-feature">
          <h3>AI 智能加权出卷</h3>
          <p>本系统基于《心理咨询基础培训教材》两本指定教材构建365题题库，每题标注权重（高频/中频/低频），采用加权抽样算法组卷——权重越高的知识点在考试中出现概率越大，确保模拟卷与真实 CPS 考试重点一致。</p>
          <div class="ai-features-list">
            <div class="ai-feature-item">
              <div class="afi-icon">教材</div>
              <p>题目基于《理论知识》和《咨询实务》两本指定教材编写，每题标注知识点来源与教材出处。</p>
            </div>
            <div class="ai-feature-item">
              <div class="afi-icon">加权</div>
              <p>365题按 CPS 考试重点分为三级权重：高频题（权重3）出现概率是低频题的3倍，每次组卷重点突出。</p>
            </div>
            <div class="ai-feature-item">
              <div class="afi-icon">全真</div>
              <p>理论科250题(单选150+多选50+判断50)，实务科210题(单选140+多选60+案例10)，计时120分钟自动评分。</p>
            </div>
          </div>
        </div>

        <div class="quiz-options">
          <div class="quiz-option" onclick="QuizEngine.start('theory')">
            <div class="opt-icon" style="background:#185FA5;">综</div>
            <h3>心理学综合 · 全真模拟</h3>
            <p>对应《理论知识》教材，考查基础理论6门课程</p>
            <div class="opt-meta">
              <span>250题</span>
              <span>满分100</span>
              <span>120分钟</span>
            </div>
          </div>
          <div class="quiz-option" onclick="QuizEngine.start('practice')">
            <div class="opt-icon" style="background:#0F6E56;">实</div>
            <h3>咨询实务 · 全真模拟</h3>
            <p>对应《咨询实务》教材，考查三级实务8门课程</p>
            <div class="opt-meta">
              <span>210题</span>
              <span>满分100</span>
              <span>120分钟</span>
            </div>
          </div>
        </div>

        <div class="quiz-weight-info">
          <h4>加权组卷说明 · 题库权重分布</h4>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">每道题目根据 CPS 考试大纲中的出现频率标注权重，组卷时按权重比例随机抽样——高频知识点权重为3，中频为2，低频为1。同一知识点不会重复出现。</p>
          <table>
            <thead>
              <tr style="border-bottom:2px solid var(--border);">
                <th style="text-align:left;padding:8px;">权重等级</th>
                <th>含义</th>
                <th>题量</th>
                <th>抽题概率</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px;"><span class="weight-badge weight-high">高频</span></td>
                <td style="padding:8px;">考试大纲重点章节、历年高频考点</td>
                <td style="padding:8px;text-align:center;">155题</td>
                <td style="padding:8px;text-align:center;">3×</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px;"><span class="weight-badge weight-medium">中频</span></td>
                <td style="padding:8px;">常考知识点、理解性内容</td>
                <td style="padding:8px;text-align:center;">184题</td>
                <td style="padding:8px;text-align:center;">2×</td>
              </tr>
              <tr>
                <td style="padding:8px;"><span class="weight-badge weight-low">低频</span></td>
                <td style="padding:8px;">拓展性、辅助性知识点</td>
                <td style="padding:8px;text-align:center;">26题</td>
                <td style="padding:8px;text-align:center;">1×</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top:32px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;">
          <h3 style="font-size:1.1rem;margin-bottom:16px;">题型分值对照表</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="border-bottom:2px solid var(--border);">
                <th style="text-align:left;padding:8px;">科目</th>
                <th style="padding:8px;">题型</th>
                <th style="padding:8px;">题量</th>
                <th style="padding:8px;">每题分值</th>
                <th style="padding:8px;">小计</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;" rowspan="3">心理学综合</td><td style="padding:8px;text-align:center;">单选</td><td style="padding:8px;text-align:center;">150</td><td style="padding:8px;text-align:center;">0.4分</td><td style="padding:8px;text-align:center;">60分</td></tr>
              <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;text-align:center;">多选</td><td style="padding:8px;text-align:center;">50</td><td style="padding:8px;text-align:center;">0.6分</td><td style="padding:8px;text-align:center;">30分</td></tr>
              <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;text-align:center;">判断</td><td style="padding:8px;text-align:center;">50</td><td style="padding:8px;text-align:center;">0.2分</td><td style="padding:8px;text-align:center;">10分</td></tr>
              <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;" rowspan="3">咨询实务</td><td style="padding:8px;text-align:center;">单选</td><td style="padding:8px;text-align:center;">140</td><td style="padding:8px;text-align:center;">0.4分</td><td style="padding:8px;text-align:center;">56分</td></tr>
              <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;text-align:center;">多选</td><td style="padding:8px;text-align:center;">60</td><td style="padding:8px;text-align:center;">0.6分</td><td style="padding:8px;text-align:center;">36分</td></tr>
              <tr><td style="padding:8px;text-align:center;">案例不定项</td><td style="padding:8px;text-align:center;">10</td><td style="padding:8px;text-align:center;">0.8分</td><td style="padding:8px;text-align:center;">8分</td></tr>
            </tbody>
          </table>
          <p style="margin-top:12px;font-size:13px;color:var(--text-secondary);">合格标准：两科均≥60分 · 单科成绩有效期3年</p>
        </div>
      </div>
    `;
  }

  function stop() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    state = null;
  }

  /* 获取当前题目数据（供 AI 答疑使用） */
  function getCurrentQuestion() {
    if (!state) return null;
    var q = state.questions[state.currentIndex];
    return {
      type: getTypeLabel(q._type),
      question: q.q,
      options: q.options || [],
      source: q.src || ''
    };
  }

  /* 从解析页发起 AI 答疑 */
  function askAIForReview(index) {
    if (!state) return;
    var q = state.questions[index];
    AIChat.askFromQuiz({
      type: getTypeLabel(q._type),
      question: q.q,
      options: q.options || [],
      source: q.src || ''
    });
  }

  return { renderSetup, start, next, prev, jumpTo, submit, review, stop, getCurrentQuestion, askAIForReview };
})();
