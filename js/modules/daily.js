/**
 * 每日一练模块（前端）
 * 从后端 /api/daily 获取当日题集，作答、提交判分、查看解析与打卡连续天数。
 */
const DailyModule = (function() {
  let state = { questions: [], date: '', submitted: false, results: null, streak: 0, days: 0 };

  const CAT_LABEL = {
    theory_single: '理论·单选', theory_multiple: '理论·多选', theory_judge: '理论·判断',
    practice_single: '实务·单选', practice_multiple: '实务·多选', practice_case: '实务·案例'
  };

  function isJudge(cat) { return cat === 'theory_judge'; }
  function isMultiple(cat) { return cat === 'theory_multiple' || cat === 'practice_multiple' || cat === 'practice_case'; }

  async function loadData(app) {
    try {
      const [today, streak] = await Promise.all([
        CPS_API.request('/daily/today'),
        CPS_API.request('/daily/streak').catch(() => ({ streak: 0, days: 0, loggedIn: false }))
      ]);
      state.questions = today.questions || [];
      state.date = today.date || '';
      state.empty = today.empty || false;
      state.streak = streak.streak || 0;
      state.days = streak.days || 0;
      state.submitted = false;
      state.results = null;
      renderView(app);
    } catch (e) {
      app.innerHTML = `<div class="daily-empty">加载失败：${e.message}</div>`;
    }
  }

  function renderView(app) {
    if (state.empty || state.questions.length === 0) {
      app.innerHTML = `
        <div class="daily-wrap">
          <div class="daily-header">
            <h1>每日一练</h1>
            <p>从已验证题库中精选当日练习，巩固高频考点。</p>
          </div>
          <div class="daily-empty">题库暂为空，请先在 CMS 导入或生成题目。</div>
        </div>`;
      return;
    }

    const dateStr = state.date;
    const streakHtml = `
      <div class="daily-streak">
        <span class="streak-num">🔥 ${state.streak}</span>
        <span class="streak-label">连续打卡天 · 累计 ${state.days} 天</span>
      </div>`;

    const listHtml = state.questions.map((q, i) => questionCardHtml(q, i)).join('');

    const submitBar = state.submitted ? '' : `
      <div class="daily-submit-bar">
        <button class="btn btn-primary" id="dailySubmitBtn" onclick="DailyModule.submit()">提交并判分</button>
        <span class="daily-hint">共 ${state.questions.length} 题 · 答完点击提交</span>
      </div>`;

    app.innerHTML = `
      <div class="daily-wrap">
        <div class="daily-header">
          <div>
            <h1>每日一练</h1>
            <p>日期：${dateStr} · 从已验证题库中精选 ${state.questions.length} 题，打卡巩固考点。</p>
          </div>
          ${streakHtml}
        </div>
        <div class="daily-list">${listHtml}</div>
        ${submitBar}
        <div id="dailyResult"></div>
      </div>`;

    if (state.submitted) renderResult();
  }

  function questionCardHtml(q, i) {
    const label = CAT_LABEL[q.category] || q.category;
    const optionsHtml = (q.options || []).map((opt, oi) => {
      const letter = String.fromCharCode(65 + oi);
      const inputType = isMultiple(q.category) ? 'checkbox' : 'radio';
      const name = `q_${q.id}`;
      return `
        <label class="opt-row" data-qid="${q.id}" data-val="${isJudge(q.category) ? opt : letter}">
          <input type="${inputType}" name="${name}" value="${isJudge(q.category) ? opt : letter}">
          <span class="opt-letter">${isJudge(q.category) ? '' : letter}</span>
          <span class="opt-text">${opt}</span>
        </label>`;
    }).join('');

    return `
      <div class="daily-q" id="dq_${q.id}">
        <div class="daily-q-head">
          <span class="daily-q-no">${i + 1}</span>
          <span class="tag tag-${q.category.startsWith('theory') ? 'theory' : 'practice'}">${label}</span>
          ${q.difficulty ? `<span class="daily-diff diff-${q.difficulty}">${q.difficulty}</span>` : ''}
        </div>
        <div class="daily-q-body">${q.question}</div>
        <div class="daily-opts">${optionsHtml}</div>
        <div class="daily-q-feedback" id="fb_${q.id}"></div>
      </div>`;
  }

  function collectAnswers() {
    const answers = {};
    state.questions.forEach(q => {
      const name = `q_${q.id}`;
      const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
      if (checked.length === 0) return;
      if (isMultiple(q.category)) {
        answers[q.id] = Array.from(checked).map(c => c.value).sort().join('');
      } else {
        answers[q.id] = checked[0].value;
      }
    });
    return answers;
  }

  async function submit() {
    const answers = collectAnswers();
    if (Object.keys(answers).length < state.questions.length) {
      alert('还有题目未作答，请完成全部题目后再提交。');
      return;
    }
    try {
      const res = await CPS_API.request('/daily/submit', {
        method: 'POST',
        body: JSON.stringify({ date: state.date, answers })
      });
      state.submitted = true;
      state.results = res;
      renderResult();
      document.getElementById('dailyResult').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      alert('提交失败：' + e.message);
    }
  }

  function renderResult() {
    const r = state.results;
    if (!r) return;
    const banner = `
      <div class="daily-result-banner ${r.score >= 60 ? 'pass' : 'fail'}">
        <div class="dr-score">${r.score}<span>分</span></div>
        <div class="dr-meta">答对 ${r.correct} / ${r.total} 题${state.streak > 0 ? ` · 🔥 连续打卡 ${state.streak} 天` : ''}</div>
        <div class="dr-tip">${r.score >= 60 ? '✓ 今日达标，继续保持！' : '未达 60 分，查看解析巩固一下～'}</div>
      </div>`;

    const feedbackHtml = r.results.map(item => {
      const judge = isJudge(item.category);
      const correctSet = new Set(judge ? [item.correctAnswer] : (item.correctAnswer || '').toUpperCase().split(''));
      const userSet = item.userAnswer ? new Set(judge ? [item.userAnswer] : item.userAnswer.toUpperCase().split('')) : new Set();
      const optsHtml = (item.options || []).map((opt, oi) => {
        const letter = judge ? '' : String.fromCharCode(65 + oi);
        const optKey = judge ? opt : letter;
        let cls = 'opt-row';
        if (correctSet.has(optKey)) cls += ' opt-correct';
        else if (!item.isCorrect && userSet.has(optKey)) cls += ' opt-wrong';
        return `<div class="${cls}"><span class="opt-letter">${letter}</span><span class="opt-text">${opt}</span></div>`;
      }).join('');

      return `
        <div class="daily-q ${item.isCorrect ? 'is-correct' : 'is-wrong'}">
          <div class="daily-q-head">
            <span class="daily-q-no">${item.isCorrect ? '✓' : '✗'}</span>
            <span class="daily-q-flag">${item.isCorrect ? '回答正确' : '回答错误'}</span>
          </div>
          <div class="daily-q-body">${item.question}</div>
          <div class="daily-opts">${optsHtml}</div>
          <div class="daily-explain">
            <strong>解析：</strong>${item.explanation || '（无）'}
            ${item.source ? `<div class="daily-src">来源：${item.source}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    const resultEl = document.getElementById('dailyResult');
    if (resultEl) {
      resultEl.innerHTML = banner + `<div class="daily-list">${feedbackHtml}</div>
        <div class="daily-submit-bar"><button class="btn btn-secondary" onclick="location.reload()">刷新查看新的一天</button></div>`;
    }
    // 隐藏提交栏
    const bar = document.getElementById('dailySubmitBtn');
    if (bar) bar.closest('.daily-submit-bar').style.display = 'none';
  }

  function render(app) {
    loadData(app);
  }

  return { render, submit };
})();
