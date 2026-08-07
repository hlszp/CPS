/**
 * CPS 三级考试平台 - 管理后台逻辑
 */
const API = '/api';
let token = localStorage.getItem('cps_admin_token') || '';
let currentUser = null;

// ================================================================
// API 工具函数
// ================================================================
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// ================================================================
// 登录/登出
// ================================================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('cps_admin_token', token);
    showAdmin();
  } catch (err) {
    document.getElementById('loginError').textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  token = '';
  currentUser = null;
  localStorage.removeItem('cps_admin_token');
  document.getElementById('adminApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
});

async function showAdmin() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  document.getElementById('adminName').textContent = currentUser.name;
  document.getElementById('adminEmail').textContent = currentUser.email;
  loadDashboard();
}

// ================================================================
// 一键打开门户首页
// ================================================================
function openPortalHome() {
  const win = window.open('../index.html', '_blank');
  if (!win) {
    showToast('浏览器拦截了弹窗，请允许后重试', 'error');
    return;
  }
  showToast('已在新标签页打开门户首页', 'success');
}

// ================================================================
// Tab 切换
// ================================================================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');

  // 按需加载
  if (tab === 'dashboard') loadDashboard();
  if (tab === 'courses') loadCourses();
  if (tab === 'questions') loadQuestions();
  if (tab === 'practice') loadPractice();
  if (tab === 'knowledge') loadKnowledge();
  if (tab === 'news') loadNews();
  if (tab === 'pending') loadPending();
  if (tab === 'agents') loadAgents();
  if (tab === 'users') loadUsers();
}

// ================================================================
// 仪表盘
// ================================================================
async function loadDashboard() {
  try {
    const s = await api('/stats');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = (v === undefined || v === null) ? '-' : v; };
    set('statCourses', s.courses);
    set('statQuestions', s.questions);
    set('statPractice', s.practiceQuestions);
    set('statNodes', s.knowledgeNodes);
    set('statNews', s.news);
    set('statUsers', s.users !== undefined ? s.users : '—');

    // 待审核角标
    const badge = document.getElementById('pendingBadge');
    if (badge) {
      if (s.pendingUpdates && s.pendingUpdates > 0) {
        badge.textContent = s.pendingUpdates;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    console.error('仪表盘数据加载失败', e);
    ['statCourses','statQuestions','statPractice','statNodes','statNews','statUsers']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '—'; });
  }
}

// ================================================================
// 课程管理
// ================================================================
async function loadCourses() {
  const filter = document.getElementById('courseTypeFilter').value;
  const data = await api('/courses' + (filter ? `?type=${filter}` : ''));
  const list = document.getElementById('courseList');
  list.innerHTML = data.courses.map(c => `
    <div class="content-item">
      <div class="content-item-main">
        <div class="content-item-title">${c.icon || '📖'} ${c.title}</div>
        <div class="content-item-meta">
          <span class="tag tag-${c.type}">${c.type === 'theory' ? '理论' : '实务'}</span>
          ${c.description ? c.description.substring(0, 60) + '...' : ''}
        </div>
      </div>
      <div class="content-item-actions">
        <button class="btn-edit" onclick="editCourse('${c.id}')">编辑</button>
        <button class="btn-danger" onclick="deleteCourse('${c.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('courseTypeFilter').addEventListener('change', loadCourses);

async function editCourse(id) {
  const data = await api('/courses/' + id);
  const c = data.course;
  openCourseEditor(c);
}

function openCourseEditor(course = null) {
  const isEdit = !!course;
  document.getElementById('modalTitle').textContent = isEdit ? '编辑课程' : '新建课程';
  document.getElementById('modalBody').innerHTML = `
    <form id="courseForm">
      <div class="form-row">
        <div><label>ID</label><input type="text" name="id" value="${course?.id || ''}" ${isEdit ? 'readonly' : 'required'}></div>
        <div><label>类型</label>
          <select name="type" required>
            <option value="theory" ${course?.type === 'theory' ? 'selected' : ''}>理论课</option>
            <option value="practice" ${course?.type === 'practice' ? 'selected' : ''}>实务课</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div><label>标题</label><input type="text" name="title" value="${course?.title || ''}" required></div>
        <div><label>图标</label><input type="text" name="icon" value="${course?.icon || ''}" placeholder="一个字"></div>
      </div>
      <div class="form-row">
        <div><label>颜色</label><input type="text" name="color" value="${course?.color || '#185FA5'}"></div>
        <div><label>排序</label><input type="number" name="sort_order" value="${course?.sort_order || 0}"></div>
      </div>
      <label>描述</label>
      <textarea name="description">${course?.description || ''}</textarea>
      <label>内容 (JSON 格式 - chapters 数组)</label>
      <textarea name="content" style="min-height:300px;font-family:monospace;font-size:12px">${course?.content ? JSON.stringify(course.content, null, 2) : ''}</textarea>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-save">保存</button>
      </div>
    </form>
  `;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    fd.forEach((v, k) => {
      if (k === 'content' && v) { body.content = JSON.parse(v); }
      else if (k === 'sort_order') body[k] = parseInt(v);
      else body[k] = v;
    });
    body.tag = body.type;
    try {
      if (isEdit) {
        await api('/courses/' + body.id, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/courses', { method: 'POST', body: JSON.stringify(body) });
      }
      showToast('保存成功', 'success');
      closeModal();
      loadCourses();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function deleteCourse(id) {
  if (!confirm('确定删除此课程？此操作不可撤销。')) return;
  try {
    await api('/courses/' + id, { method: 'DELETE' });
    showToast('删除成功', 'success');
    loadCourses();
  } catch (e) { showToast(e.message, 'error'); }
}

// ================================================================
// 题库管理
// ================================================================
async function loadQuestions() {
  const cat = document.getElementById('qCategoryFilter').value;
  const search = document.getElementById('qSearch').value.toLowerCase();
  const data = await api('/questions' + (cat ? `?category=${cat}&all=true` : '?all=true'));
  let items = data.questions;
  if (search) {
    items = items.filter(q => q.question.toLowerCase().includes(search) || q.id.toLowerCase().includes(search));
  }

  // 统计
  const stats = {};
  data.questions.forEach(q => { stats[q.category] = (stats[q.category] || 0) + 1; });
  const catNames = { theory_single:'理论单选', theory_multiple:'理论多选', theory_judge:'理论判断', practice_single:'实务单选', practice_multiple:'实务多选', practice_case:'实务案例' };
  document.getElementById('qStats').innerHTML = Object.entries(stats).map(([k, v]) => `${catNames[k]||k}: ${v}`).join(' | ') + ` | 总计: ${data.questions.length}`;

  // 显示前 100 条
  const display = items.slice(0, 100);
  const list = document.getElementById('questionList');
  list.innerHTML = display.map(q => `
    <div class="content-item">
      <div class="content-item-main">
        <div class="content-item-title">${q.id} · ${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}</div>
        <div class="content-item-meta">
          ${catNames[q.category] || q.category} |
          <span class="tag tag-weight-${q.weight >= 3 ? 'high' : q.weight === 2 ? 'mid' : 'low'}">权重:${q.weight}</span>
          ${q.source ? ' | ' + q.source : ''}
        </div>
      </div>
      <div class="content-item-actions">
        <button class="btn-edit" onclick="editQuestion('${q.id}')">编辑</button>
        <button class="btn-danger" onclick="deleteQuestion('${q.id}')">删除</button>
      </div>
    </div>
  `).join('');
  if (items.length > 100) {
    list.innerHTML += `<div style="text-align:center;padding:12px;color:#999">显示前 100 条，共 ${items.length} 条</div>`;
  }
}

document.getElementById('qCategoryFilter').addEventListener('change', loadQuestions);
document.getElementById('qSearch').addEventListener('input', () => { clearTimeout(window._qTimer); window._qTimer = setTimeout(loadQuestions, 300); });

function openQuestionEditor() {
  document.getElementById('modalTitle').textContent = '添加题目';
  document.getElementById('modalBody').innerHTML = `
    <form id="questionForm">
      <div class="form-row">
        <div><label>ID</label><input type="text" name="id" placeholder="TS001" required></div>
        <div><label>分类</label>
          <select name="category" required>
            <option value="theory_single">理论·单选题</option>
            <option value="theory_multiple">理论·多选题</option>
            <option value="theory_judge">理论·判断题</option>
            <option value="practice_single">实务·单选题</option>
            <option value="practice_multiple">实务·多选题</option>
            <option value="practice_case">实务·案例题</option>
          </select>
        </div>
      </div>
      <label>题目</label>
      <textarea name="question" required></textarea>
      <label>选项 (每行一个)</label>
      <textarea name="options" placeholder="选项A&#10;选项B&#10;选项C&#10;选项D"></textarea>
      <div class="form-row">
        <div><label>答案</label><input type="text" name="answer" placeholder="B 或 AB" required></div>
        <div><label>权重 (1-3)</label><input type="number" name="weight" value="2" min="1" max="3"></div>
        <div><label>难度</label><input type="text" name="difficulty" placeholder="easy/medium/hard"></div>
      </div>
      <label>解析</label>
      <textarea name="explanation"></textarea>
      <label>来源</label>
      <input type="text" name="source" placeholder="心理学导论·记忆">
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-save">保存</button>
      </div>
    </form>
  `;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('questionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    fd.forEach((v, k) => {
      if (k === 'options' && v) { body.options = v.split('\n').filter(x => x.trim()); }
      else if (k === 'weight') body[k] = parseInt(v);
      else body[k] = v;
    });
    try {
      await api('/questions', { method: 'POST', body: JSON.stringify(body) });
      showToast('添加成功', 'success');
      closeModal();
      loadQuestions();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function editQuestion(id) {
  const data = await api('/questions/' + id);
  const q = data.question;
  document.getElementById('modalTitle').textContent = '编辑题目 ' + q.id;
  document.getElementById('modalBody').innerHTML = `
    <form id="questionEditForm">
      <div class="form-row">
        <div><label>分类</label>
          <select name="category">
            <option value="theory_single" ${q.category==='theory_single'?'selected':''}>理论·单选题</option>
            <option value="theory_multiple" ${q.category==='theory_multiple'?'selected':''}>理论·多选题</option>
            <option value="theory_judge" ${q.category==='theory_judge'?'selected':''}>理论·判断题</option>
            <option value="practice_single" ${q.category==='practice_single'?'selected':''}>实务·单选题</option>
            <option value="practice_multiple" ${q.category==='practice_multiple'?'selected':''}>实务·多选题</option>
            <option value="practice_case" ${q.category==='practice_case'?'selected':''}>实务·案例题</option>
          </select>
        </div>
        <div><label>权重</label><input type="number" name="weight" value="${q.weight||2}" min="1" max="3"></div>
        <div><label>难度</label><input type="text" name="difficulty" value="${q.difficulty||''}"></div>
      </div>
      <label>题目</label>
      <textarea name="question" required>${q.question}</textarea>
      <label>选项 (每行一个)</label>
      <textarea name="options">${(q.options||[]).join('\n')}</textarea>
      <div class="form-row">
        <div><label>答案</label><input type="text" name="answer" value="${q.answer}" required></div>
      </div>
      <label>解析</label>
      <textarea name="explanation">${q.explanation||''}</textarea>
      <label>来源</label>
      <input type="text" name="source" value="${q.source||''}">
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-save">保存</button>
      </div>
    </form>
  `;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('questionEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    fd.forEach((v, k) => {
      if (k === 'options' && v) { body.options = v.split('\n').filter(x => x.trim()); }
      else if (k === 'weight') body[k] = parseInt(v);
      else body[k] = v;
    });
    try {
      await api('/questions/' + id, { method: 'PUT', body: JSON.stringify(body) });
      showToast('更新成功', 'success');
      closeModal();
      loadQuestions();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function deleteQuestion(id) {
  if (!confirm('确定删除此题目？')) return;
  try {
    await api('/questions/' + id, { method: 'DELETE' });
    showToast('删除成功', 'success');
    loadQuestions();
  } catch (e) { showToast(e.message, 'error'); }
}

// ================================================================
// 练习卡管理
// ================================================================
async function loadPractice() {
  const data = await api('/practice');
  const list = document.getElementById('practiceList');
  list.innerHTML = data.courses.map(c => `
    <div class="content-item" style="flex-direction:column;align-items:flex-start">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="content-item-title">${c.courseTitle}</div>
          <div class="content-item-meta">
            <span class="tag tag-${c.courseTag}">${c.courseTag === 'theory' ? '理论' : '实务'}</span>
            ${c.topics.length} 个主题 · ${c.topics.reduce((s, t) => s + t.questions.length, 0)} 道题
          </div>
        </div>
        <button class="btn-edit" onclick="openTopicEditor('${c.courseId}','${c.courseTitle}','${c.courseTag}','${c.courseColor}')">➕ 添加主题</button>
      </div>
      <div style="width:100%;margin-top:8px;padding-left:16px">
        ${c.topics.map(t => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">
            <span>${t.topicTitle} (${t.questions.length}题)</span>
            <button class="btn-danger" onclick="deleteTopic('${t.topicId}')">删除</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function openTopicEditor(courseId, courseTitle, courseTag, courseColor) {
  document.getElementById('modalTitle').textContent = '新建练习主题';
  document.getElementById('modalBody').innerHTML = `
    <form id="topicForm">
      <input type="hidden" name="courseId" value="${courseId}">
      <input type="hidden" name="courseTitle" value="${courseTitle}">
      <input type="hidden" name="courseTag" value="${courseTag}">
      <input type="hidden" name="courseColor" value="${courseColor}">
      <label>主题 ID</label>
      <input type="text" name="topicId" placeholder="如 intro_05" required>
      <label>主题标题</label>
      <input type="text" name="topicTitle" required>
      <label>章节</label>
      <input type="text" name="chapter" placeholder="第五章">
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-save">创建</button>
      </div>
    </form>
  `;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('topicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    fd.forEach((v, k) => body[k] = v);
    try {
      await api('/practice/topic', { method: 'POST', body: JSON.stringify(body) });
      showToast('主题创建成功', 'success');
      closeModal();
      loadPractice();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function deleteTopic(id) {
  if (!confirm('删除主题将同时删除其下所有题目，确定？')) return;
  try {
    await api('/practice/topic/' + id, { method: 'DELETE' });
    showToast('删除成功', 'success');
    loadPractice();
  } catch (e) { showToast(e.message, 'error'); }
}

// ================================================================
// 知识图谱
// ================================================================
async function loadKnowledge() {
  const data = await api('/knowledge');
  const g = data.graph;
  document.getElementById('kgInfo').textContent = `节点: ${g.nodes.length} | 边: ${g.edges.length}`;
  document.getElementById('kgEditor').value = JSON.stringify(g, null, 2);
}

async function saveKnowledge() {
  try {
    const graph = JSON.parse(document.getElementById('kgEditor').value);
    await api('/knowledge', { method: 'PUT', body: JSON.stringify({ graph }) });
    showToast('知识图谱保存成功', 'success');
    loadKnowledge();
  } catch (e) { showToast('JSON 格式错误: ' + e.message, 'error'); }
}

function exportKnowledge() {
  const data = document.getElementById('kgEditor').value;
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'knowledge-graph.json';
  a.click();
}

// ================================================================
// 资讯管理
// ================================================================
// 资讯管理多选状态
let _newsSelectedIds = new Set();
let _newsItemIds = [];

async function loadNews() {
  const cat = document.getElementById('newsCategoryFilter').value;
  const data = await api('/news' + (cat ? `?category=${cat}` : ''));
  const catNames = { exam:'考试动态', career:'职业展望', research:'学术研究', resource:'权威资源' };
  const list = document.getElementById('newsList');
  _newsItemIds = data.news.map(n => n.id);
  // 清理已不在列表中的选中项
  _newsSelectedIds = new Set([..._newsSelectedIds].filter(id => _newsItemIds.includes(id)));
  list.innerHTML = data.news.map(n => `
    <div class="content-item news-item ${_newsSelectedIds.has(n.id) ? 'selected' : ''}">
      <label class="news-checkbox-wrap">
        <input type="checkbox" class="news-checkbox" data-id="${n.id}" ${_newsSelectedIds.has(n.id) ? 'checked' : ''} onchange="toggleNewsItem(${n.id}, this.checked)">
      </label>
      <div class="content-item-main">
        <div class="content-item-title">${n.title}</div>
        <div class="content-item-meta">${catNames[n.category]||n.category} | ${n.source||''} | ${n.created_at||''}</div>
      </div>
      <div class="content-item-actions">
        <button class="btn-edit" onclick="editNews(${n.id})">编辑</button>
        <button class="btn-danger" onclick="deleteNews(${n.id})">删除</button>
      </div>
    </div>
  `).join('');
  updateNewsBatchBar();
}

// 单个资讯勾选
function toggleNewsItem(id, checked) {
  if (checked) _newsSelectedIds.add(id);
  else _newsSelectedIds.delete(id);
  const item = document.querySelector(`.news-checkbox[data-id="${id}"]`)?.closest('.news-item');
  if (item) item.classList.toggle('selected', checked);
  updateNewsBatchBar();
}

// 全选/取消全选
function toggleNewsSelectAll(checked) {
  if (checked) _newsItemIds.forEach(id => _newsSelectedIds.add(id));
  else _newsSelectedIds.clear();
  document.querySelectorAll('.news-checkbox').forEach(cb => {
    cb.checked = checked;
    cb.closest('.news-item')?.classList.toggle('selected', checked);
  });
  updateNewsBatchBar();
}

// 更新批量操作栏显示与计数
function updateNewsBatchBar() {
  const bar = document.getElementById('newsBatchBar');
  if (!bar) return;
  bar.style.display = _newsItemIds.length > 0 ? 'flex' : 'none';
  document.getElementById('newsSelectedCount').textContent = _newsSelectedIds.size;
  document.getElementById('newsSelectAll').indeterminate = _newsSelectedIds.size > 0 && _newsSelectedIds.size < _newsItemIds.length;
  document.getElementById('newsSelectAll').checked = _newsSelectedIds.size === _newsItemIds.length && _newsItemIds.length > 0;
  document.getElementById('btnNewsBatchCat').disabled = false;
}

// 批量修改分类
async function batchUpdateNewsCategory() {
  const ids = [..._newsSelectedIds];
  if (ids.length === 0) return showToast('请先勾选资讯', 'error');
  const category = document.getElementById('newsBatchCategory').value;
  if (!confirm(`确认将选中的 ${ids.length} 条资讯分类改为「${category}」？`)) return;
  const btn = document.getElementById('btnNewsBatchCat');
  btn.disabled = true; btn.textContent = '处理中...';
  try {
    const data = await api('/news/batch-category', { method: 'PUT', body: JSON.stringify({ ids, category }) });
    showToast(data.message, 'success');
    _newsSelectedIds.clear();
    loadNews();
  } catch (e) { showToast(e.message, 'error'); btn.disabled = false; btn.textContent = '应用分类'; }
}

// AI 智能重分类（对选中项；若未选则对所有 research 项）
async function aiReclassifyNews() {
  const ids = [..._newsSelectedIds];
  if (!confirm(ids.length ? `确认对选中的 ${ids.length} 条资讯调用 AI 重新判定分类？` : '确认对所有「学术研究」类资讯调用 AI 重新判定分类？')) return;
  const btn = document.getElementById('btnNewsReclassify');
  btn.disabled = true; btn.textContent = 'AI 重分类中...';
  try {
    const data = await api('/news/reclassify', { method: 'POST', body: JSON.stringify({ ids }) });
    showToast(data.message, 'success');
    loadNews();
  } catch (e) { showToast(e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = '🤖 AI 智能重分类'; }
}

document.getElementById('newsCategoryFilter').addEventListener('change', () => { _newsSelectedIds.clear(); loadNews(); });

function openNewsEditor() {
  document.getElementById('modalTitle').textContent = '发布资讯';
  document.getElementById('modalBody').innerHTML = `
    <form id="newsForm">
      <label>分类</label>
      <select name="category" required>
        <option value="exam">考试动态</option>
        <option value="career">职业展望</option>
        <option value="research">学术研究</option>
        <option value="resource">权威资源</option>
      </select>
      <label>标题</label>
      <input type="text" name="title" required>
      <label>摘要</label>
      <textarea name="summary"></textarea>
      <label>内容</label>
      <textarea name="content" style="min-height:150px"></textarea>
      <div class="form-row">
        <div><label>来源</label><input type="text" name="source"></div>
        <div><label>链接</label><input type="text" name="source_url"></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-save">发布</button>
      </div>
    </form>
  `;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      await api('/news', { method: 'POST', body: JSON.stringify(body) });
      showToast('发布成功', 'success');
      closeModal();
      loadNews();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function editNews(id) {
  const data = await api('/news/' + id);
  const n = data.news;
  document.getElementById('modalTitle').textContent = '编辑资讯';
  document.getElementById('modalBody').innerHTML = `
    <form id="newsEditForm">
      <label>分类</label>
      <select name="category" required>
        <option value="exam" ${n.category==='exam'?'selected':''}>考试动态</option>
        <option value="career" ${n.category==='career'?'selected':''}>职业展望</option>
        <option value="research" ${n.category==='research'?'selected':''}>学术研究</option>
        <option value="resource" ${n.category==='resource'?'selected':''}>权威资源</option>
      </select>
      <label>标题</label>
      <input type="text" name="title" value="${n.title}" required>
      <label>摘要</label>
      <textarea name="summary">${n.summary||''}</textarea>
      <label>内容</label>
      <textarea name="content" style="min-height:150px">${n.content||''}</textarea>
      <div class="form-row">
        <div><label>来源</label><input type="text" name="source" value="${n.source||''}"></div>
        <div><label>链接</label><input type="text" name="source_url" value="${n.source_url||''}"></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="submit" class="btn-save">保存</button>
      </div>
    </form>
  `;
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('newsEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      await api('/news/' + id, { method: 'PUT', body: JSON.stringify(body) });
      showToast('更新成功', 'success');
      closeModal();
      loadNews();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function deleteNews(id) {
  if (!confirm('确定删除此资讯？')) return;
  try {
    await api('/news/' + id, { method: 'DELETE' });
    showToast('删除成功', 'success');
    loadNews();
  } catch (e) { showToast(e.message, 'error'); }
}

// ================================================================
// 待审核内容管理
// ================================================================
let _pendingSelectedIds = new Set(); // 选中项 ID 集合
let _pendingItemIds = [];            // 当前列表所有项 ID（用于全选）

async function loadPending() {
  const status = document.getElementById('pendingStatusFilter').value;
  const type = document.getElementById('pendingTypeFilter').value;
  const minConf = document.getElementById('confidenceSlider').value;
  let url = '/pending';
  const params = [];
  if (status) params.push('status=' + status);
  if (type) params.push('agent_type=' + type);
  if (minConf && parseInt(minConf) > 0) params.push('min_confidence=' + (parseInt(minConf) / 100));
  if (params.length) url += '?' + params.join('&');

  try {
    const data = await api(url);
    const list = document.getElementById('pendingList');
    const catNames = { exam:'考试动态', career:'职业展望', research:'学术研究', resource:'权威资源' };
    const typeNames = { news:'新闻采集', literature:'文献采集', question:'智能出题', knowledge:'知识图谱' };

    // 更新当前列表的 ID 集合
    _pendingItemIds = data.items.map(i => i.id);

    // 清理已不在列表中的选中项
    _pendingSelectedIds = new Set([..._pendingSelectedIds].filter(id => _pendingItemIds.includes(id)));

    if (data.items.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:#999">暂无符合条件的待审核内容</div>';
    } else {
      list.innerHTML = data.items.map(item => {
        const c = item.contentParsed || {};
        const conf = Math.round((item.ai_confidence || 0) * 100);
        const confColor = conf >= 70 ? '#52c41a' : conf >= 40 ? '#faad14' : '#ff4d4f';
        const isChecked = _pendingSelectedIds.has(item.id);
        const isPending = item.status === 'pending';
        return `
          <div class="content-item pending-item ${isChecked ? 'selected' : ''}" style="flex-direction:column;align-items:stretch">
            <div style="width:100%;display:flex;justify-content:space-between;align-items:flex-start">
              <div class="pending-item-checkbox" style="flex:1">
                ${isPending ? `<input type="checkbox" class="pending-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} onchange="toggleSelectItem('${item.id}', this.checked)">` : '<div style="width:16px;flex-shrink:0"></div>'}
                <div style="flex:1">
                  <div class="content-item-title">${item.title}</div>
                  <div class="content-item-meta">
                    <span class="tag tag-agent-${item.agent_type}">${typeNames[item.agent_type]||item.agent_type}</span>
                    ${c.category ? '<span class="tag">' + (catNames[c.category]||c.category) + '</span>' : ''}
                    <span style="color:${confColor};font-weight:600">AI置信度: ${conf}%</span>
                    | 来源: ${item.source||'未知'}
                    | ${item.created_at||''}
                  </div>
                  ${item.summary ? '<div style="margin-top:6px;color:#666;font-size:13px;line-height:1.5">' + item.summary + '</div>' : ''}
                  ${c.key_points && c.key_points.length ? '<div style="margin-top:4px;font-size:12px;color:#888">要点: ' + c.key_points.join(' · ') + '</div>' : ''}
                  ${item.source_url ? '<div style="margin-top:4px"><a href="' + item.source_url + '" target="_blank" style="font-size:12px;color:#1890ff">查看原文 ↗</a></div>' : ''}
                </div>
              </div>
              <div class="content-item-actions" style="flex-shrink:0;margin-left:12px">
                ${isPending ? `
                  <button class="btn-edit" onclick="approvePending('${item.id}')">✓ 批准</button>
                  <button class="btn-edit" onclick="editPending('${item.id}')">✏️ 编辑</button>
                  <button class="btn-danger" onclick="rejectPending('${item.id}')">✕ 拒绝</button>
                ` : `
                  <span class="tag tag-${item.status === 'published' ? 'theory' : 'practice'}">${item.status === 'published' ? '已发布' : '已拒绝'}</span>
                  <button class="btn-danger" onclick="deletePending('${item.id}')">删除</button>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 更新全选框状态
    updateSelectAllCheckbox();

    // 更新批量操作栏
    updateBatchBar();

    // 加载统计
    const stats = await api('/pending/stats');
    document.getElementById('pendingStats').textContent =
      `待审核: ${stats.counts.pending} | 已发布: ${stats.counts.published} | 已拒绝: ${stats.counts.rejected}`;

    // 更新导航徽章
    const badge = document.getElementById('pendingBadge');
    if (stats.counts.pending > 0) {
      badge.textContent = stats.counts.pending;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.getElementById('pendingStatusFilter').addEventListener('change', () => { _pendingSelectedIds.clear(); loadPending(); });
document.getElementById('pendingTypeFilter').addEventListener('change', () => { _pendingSelectedIds.clear(); loadPending(); });

// 置信度滑块
document.getElementById('confidenceSlider').addEventListener('input', (e) => {
  document.getElementById('confidenceValue').textContent = e.target.value + '%';
});
document.getElementById('confidenceSlider').addEventListener('change', () => {
  _pendingSelectedIds.clear();
  loadPending();
});

function clearConfidenceFilter() {
  document.getElementById('confidenceSlider').value = 0;
  document.getElementById('confidenceValue').textContent = '0%';
  _pendingSelectedIds.clear();
  loadPending();
}

// 全选/取消全选
function toggleSelectAll(checked) {
  if (checked) {
    _pendingItemIds.forEach(id => _pendingSelectedIds.add(id));
  } else {
    _pendingSelectedIds.clear();
  }
  // 更新所有复选框 UI
  document.querySelectorAll('.pending-checkbox').forEach(cb => {
    cb.checked = checked;
  });
  // 更新选中高亮
  document.querySelectorAll('.pending-item').forEach(el => {
    if (checked) el.classList.add('selected');
    else el.classList.remove('selected');
  });
  updateBatchBar();
}

// 单项选择
function toggleSelectItem(id, checked) {
  if (checked) {
    _pendingSelectedIds.add(id);
  } else {
    _pendingSelectedIds.delete(id);
  }
  // 更新该项高亮
  const cb = document.querySelector(`.pending-checkbox[data-id="${id}"]`);
  if (cb) {
    const item = cb.closest('.pending-item');
    if (item) {
      if (checked) item.classList.add('selected');
      else item.classList.remove('selected');
    }
  }
  updateSelectAllCheckbox();
  updateBatchBar();
}

// 更新全选框状态
function updateSelectAllCheckbox() {
  const selectAll = document.getElementById('selectAllCheckbox');
  if (_pendingItemIds.length === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (_pendingSelectedIds.size === _pendingItemIds.length) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else if (_pendingSelectedIds.size > 0) {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  }
}

// 更新批量操作栏
function updateBatchBar() {
  const count = _pendingSelectedIds.size;
  document.getElementById('selectedCount').textContent = count;
  document.getElementById('btnBatchApprove').disabled = count === 0;
  document.getElementById('btnBatchReject').disabled = count === 0;
}

// 批量批准
async function batchApprove() {
  const ids = [..._pendingSelectedIds];
  if (ids.length === 0) return;
  if (!confirm(`确认批量批准 ${ids.length} 条内容并发布到网站？`)) return;

  const btn = document.getElementById('btnBatchApprove');
  btn.disabled = true;
  btn.textContent = '处理中...';

  try {
    const data = await api('/pending/batch-approve', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
    showToast(data.message, 'success');
    _pendingSelectedIds.clear();
    loadPending();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.textContent = '✓ 批量批准';
    updateBatchBar();
  }
}

// 批量拒绝
async function batchReject() {
  const ids = [..._pendingSelectedIds];
  if (ids.length === 0) return;
  if (!confirm(`确认批量拒绝 ${ids.length} 条内容？`)) return;

  const btn = document.getElementById('btnBatchReject');
  btn.disabled = true;
  btn.textContent = '处理中...';

  try {
    const data = await api('/pending/batch-reject', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
    showToast(data.message, 'success');
    _pendingSelectedIds.clear();
    loadPending();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.textContent = '✕ 批量拒绝';
    updateBatchBar();
  }
}

async function approvePending(id) {
  if (!confirm('确认发布此内容到网站？')) return;
  try {
    await api('/pending/' + id + '/approve', { method: 'POST' });
    showToast('已批准并发布', 'success');
    loadPending();
  } catch (e) { showToast(e.message, 'error'); }
}

async function rejectPending(id) {
  const notes = prompt('拒绝原因（可选）：');
  if (notes === null) return;
  try {
    await api('/pending/' + id + '/reject', { method: 'POST', body: JSON.stringify({ notes }) });
    showToast('已拒绝', 'success');
    loadPending();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deletePending(id) {
  if (!confirm('确定删除此条目？')) return;
  try {
    await api('/pending/' + id, { method: 'DELETE' });
    showToast('已删除', 'success');
    loadPending();
  } catch (e) { showToast(e.message, 'error'); }
}

async function editPending(id) {
  try {
    const data = await api('/pending/' + id);
    const item = data.item;
    const c = item.contentParsed || {};

    // 出题类型：展示完整题目 + 来源核验
    if (item.agent_type === 'question') {
      return openQuestionReview(item, c);
    }

    const catNames = { exam:'考试动态', career:'职业展望', research:'学术研究', resource:'权威资源' };

    document.getElementById('modalTitle').textContent = '编辑后发布';
    document.getElementById('modalBody').innerHTML = `
      <form id="pendingEditForm">
        <label>标题</label>
        <input type="text" name="title" value="${item.title}" required>
        <label>摘要</label>
        <textarea name="summary" style="min-height:80px">${item.summary||''}</textarea>
        <label>分类</label>
        <select name="category">
          <option value="exam" ${c.category==='exam'?'selected':''}>考试动态</option>
          <option value="career" ${c.category==='career'?'selected':''}>职业展望</option>
          <option value="research" ${c.category==='research'?'selected':''}>学术研究</option>
          <option value="resource" ${c.category==='resource'?'selected':''}>权威资源</option>
        </select>
        <label>正文内容</label>
        <textarea name="content" style="min-height:150px">${c.content||c.summary||''}</textarea>
        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
          <button type="submit" class="btn-save">编辑后发布</button>
        </div>
      </form>
    `;
    document.getElementById('modal').style.display = 'flex';

    document.getElementById('pendingEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        title: fd.get('title'),
        summary: fd.get('summary'),
        content: fd.get('content'),
        category: fd.get('category')
      };
      try {
        await api('/pending/' + id + '/approve-edit', { method: 'POST', body: JSON.stringify(body) });
        showToast('已编辑并发布', 'success');
        closeModal();
        loadPending();
      } catch (err) { showToast(err.message, 'error'); }
    });
  } catch (e) { showToast(e.message, 'error'); }
}

/**
 * 出题审核视图：展示题目全文 + 强制来源核验
 */
function openQuestionReview(item, c) {
  const catLabel = {
    theory_single:'理论·单选', theory_multiple:'理论·多选', theory_judge:'理论·判断',
    practice_single:'实务·单选', practice_multiple:'实务·多选', practice_case:'实务·案例'
  }[c.category] || c.category || '未知题型';
  const optionsHtml = (c.options && Array.isArray(c.options))
    ? c.options.map((o, i) => `<div class="qrev-opt"><span class="opt-letter">${String.fromCharCode(65+i)}</span><span>${o}</span></div>`).join('')
    : '<div style="color:#999">（判断题/无选项）</div>';

  document.getElementById('modalTitle').textContent = '出题审核 · 可信验证';
  document.getElementById('modalBody').innerHTML = `
    <div class="qrev-box">
      <div class="qrev-tagrow">
        <span class="tag tag-agent-question">智能出题</span>
        <span class="tag">${catLabel}</span>
        <span class="daily-diff ${c.difficulty||'medium'}">${c.difficulty||'medium'}</span>
        <span class="daily-diff">权重 ${c.weight||2}</span>
      </div>
      <div class="qrev-q">${c.question||''}</div>
      <div class="qrev-opts">${optionsHtml}</div>
      <div class="qrev-answer"><b>参考答案：</b>${c.answer||''}</div>
      <div class="qrev-exp"><b>解析：</b>${c.explanation||''}</div>
      <div class="qrev-source">
        <label>来源（可信验证，必填）</label>
        <input type="text" id="qrevSource" value="${c.source||''}" placeholder="教材章节 或 外部资料出处">
        ${item.source_url ? '<div style="margin-top:4px"><a href="'+item.source_url+'" target="_blank" style="font-size:12px;color:#1890ff">查看原始资料 ↗</a></div>' : ''}
      </div>
      <div class="qrev-warn">⚠️ 请确认本题确实源自上方来源（教材章节或外部资料），来源为空或不实将影响题库可信度。</div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
        <button type="button" class="btn-danger" onclick="rejectPending('${item.id}')">✕ 拒绝</button>
        <button type="button" class="btn-save" onclick="approveQuestion('${item.id}')">✓ 核验通过并入库</button>
      </div>
    </div>
  `;
  document.getElementById('modal').style.display = 'flex';
}

/** 出题审核通过：校验来源后入库 */
async function approveQuestion(id) {
  const src = document.getElementById('qrevSource');
  if (!src || !src.value.trim()) {
    showToast('来源不可为空，请填写教材章节或资料出处', 'error');
    if (src) src.focus();
    return;
  }
  try {
    await api('/pending/' + id + '/approve', { method: 'POST' });
    showToast('已核验并入库', 'success');
    closeModal();
    loadPending();
  } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// 智能体管理
// ================================================================

/** 按钮加载状态切换 */
function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

/** 显示配置状态消息 */
function showConfigStatus(msg, type) {
  const el = document.getElementById('llmConfigStatus');
  el.className = 'config-status status-' + type;
  el.textContent = msg;
}

/** 加载智能体页面全部数据 */
async function loadAgents() {
  // 并行加载配置、执行历史、统计
  loadAgentConfig();
  loadAgentRuns();
  loadAgentStats();
}

/** 加载 LLM 配置 */
async function loadAgentConfig() {
  const statusEl = document.getElementById('llmConfigStatus');
  const badgeEl = document.getElementById('llmConfigBadge');
  const llmStatEl = document.getElementById('agentLLMStatus');
  try {
    const config = await api('/agent/config');
    if (config.configured) {
      document.getElementById('llmApiUrl').value = config.apiUrl;
      document.getElementById('llmModel').value = config.model;
      document.getElementById('llmApiKey').placeholder = config.apiKeyMasked + '（已配置，留空则不修改）';
      document.getElementById('llmKeyHint').textContent = '已配置 Key: ' + config.apiKeyMasked;
      badgeEl.textContent = '已配置';
      badgeEl.className = 'agent-section-tag agent-tag-auto';
      llmStatEl.textContent = config.model;
      llmStatEl.className = 'agent-stat-value text-success';
      showConfigStatus('LLM 已配置，可点击"测试连接"验证连通性', 'success');
    } else {
      badgeEl.textContent = '未配置';
      badgeEl.className = 'agent-section-tag';
      llmStatEl.textContent = '未配置';
      llmStatEl.className = 'agent-stat-value text-warning';
      showConfigStatus('尚未配置 API Key，请填写后保存', 'warning');
    }
  } catch (e) {
    badgeEl.textContent = '加载失败';
    llmStatEl.textContent = '加载失败';
    llmStatEl.className = 'agent-stat-value text-error';
    showConfigStatus('配置加载失败: ' + e.message, 'error');
  }
}

/** 加载执行历史 */
async function loadAgentRuns() {
  const list = document.getElementById('agentRunsList');
  const refreshBtn = document.getElementById('btnRefreshRuns');
  if (refreshBtn) setButtonLoading('btnRefreshRuns', true);
  list.innerHTML = '<div class="agent-loading">加载中</div>';
  try {
    const data = await api('/agent/runs?limit=15');
    if (data.runs.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:30px 20px;color:#999;font-size:14px">暂无执行记录，点击"立即采集"开始</div>';
    } else {
      const statusLabels = { running:'运行中', success:'成功', failed:'失败' };
      list.innerHTML = data.runs.map(r => {
        const statusClass = 'run-status-' + (r.status || 'unknown');
        const statusText = statusLabels[r.status] || r.status;
        const agentLabel = r.agent_type === 'news' ? '新闻采集'
          : r.agent_type === 'literature' ? '文献采集'
          : r.agent_type === 'question' ? '智能出题' : r.agent_type;
        const triggerLabel = r.trigger === 'cron' ? '定时触发' : '手动触发';
        const timeRange = (r.started_at || '—') + ' → ' + (r.finished_at || '运行中');
        return `
          <div class="agent-run-item">
            <div class="agent-run-info">
              <div class="agent-run-title">${agentLabel} <span class="run-status-badge ${statusClass}">${statusText}</span></div>
              <div class="agent-run-meta">${triggerLabel} | 发现: ${r.items_found||0} | 保存: ${r.items_saved||0} | ${timeRange}</div>
              ${r.error ? '<div class="agent-run-error">' + r.error.slice(0,120) + '</div>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }
    // 更新概览卡片
    if (data.runs.length > 0) {
      const last = data.runs[0];
      const lastEl = document.getElementById('agentLastRun');
      const statusLabels = { running:'运行中', success:'成功', failed:'失败' };
      const statusColors = { running:'text-info', success:'text-success', failed:'text-error' };
      lastEl.textContent = statusLabels[last.status] + ' · ' + (last.finished_at || '运行中');
      lastEl.className = 'agent-stat-value ' + (statusColors[last.status] || '');
    } else {
      document.getElementById('agentLastRun').textContent = '无记录';
    }
  } catch (e) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:#ff4d4f;font-size:14px">加载失败: ' + e.message + '</div>';
  } finally {
    if (refreshBtn) setButtonLoading('btnRefreshRuns', false);
  }
}

/** 加载统计数据（更新概览） */
async function loadAgentStats() {
  try {
    const stats = await api('/pending/stats');
    const pendingEl = document.getElementById('agentPendingCount');
    const count = stats.counts.pending || 0;
    pendingEl.textContent = count + ' 条';
    pendingEl.className = 'agent-stat-value ' + (count > 0 ? 'text-warning' : 'text-success');
  } catch (e) {
    document.getElementById('agentPendingCount').textContent = '—';
  }
}

// LLM 配置保存
document.getElementById('llmConfigForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiKey = document.getElementById('llmApiKey').value.trim();
  const apiUrl = document.getElementById('llmApiUrl').value.trim();
  const model = document.getElementById('llmModel').value.trim();

  if (!apiKey) {
    showToast('请输入 API Key', 'error');
    showConfigStatus('请输入 API Key 后再保存', 'warning');
    return;
  }

  setButtonLoading('btnSaveLLM', true);
  showConfigStatus('正在保存配置...', 'loading');
  try {
    await api('/agent/config', {
      method: 'PUT',
      body: JSON.stringify({ apiKey, apiUrl, model })
    });
    showToast('配置保存成功', 'success');
    showConfigStatus('配置已保存，可点击"测试连接"验证', 'success');
    document.getElementById('llmApiKey').value = '';
    loadAgentConfig();
  } catch (e) {
    showToast(e.message, 'error');
    showConfigStatus('保存失败: ' + e.message, 'error');
  } finally {
    setButtonLoading('btnSaveLLM', false);
  }
});

/** 测试 LLM 连接 —— 发送当前表单中的值，无需先保存 */
async function testLLM() {
  const apiKey = document.getElementById('llmApiKey').value.trim();
  const apiUrl = document.getElementById('llmApiUrl').value.trim();
  const model = document.getElementById('llmModel').value.trim();

  setButtonLoading('btnTestLLM', true);
  showConfigStatus('正在测试连接，请稍候...', 'loading');

  try {
    // 如果有输入 apiKey，连同表单值一起发送；否则只测试已保存的配置
    const body = apiKey ? { apiKey, apiUrl, model } : {};
    const data = await api('/agent/test-llm', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (data.success) {
      showConfigStatus('✓ 连接成功！LLM 回复: ' + data.reply, 'success');
      showToast('LLM 连接测试成功', 'success');
    } else {
      showConfigStatus('✗ 连接失败: ' + (data.error || '未知错误'), 'error');
      showToast('连接测试失败', 'error');
    }
  } catch (e) {
    showConfigStatus('✗ 请求失败: ' + e.message, 'error');
    showToast('连接测试失败: ' + e.message, 'error');
  } finally {
    setButtonLoading('btnTestLLM', false);
  }
}

/** 触发新闻采集 —— 带轮询状态 */
let _agentPollTimer = null;

async function triggerNewsAgent() {
  const statusEl = document.getElementById('agentRunStatus');
  setButtonLoading('btnTriggerNews', true);

  // 初始状态
  statusEl.innerHTML = `
    <div class="agent-progress">
      <div class="agent-progress-row">采集中，请稍候...</div>
      <div class="agent-progress-detail">正在从 RSS 源获取并处理内容</div>
    </div>
  `;

  try {
    await api('/agent/trigger/news', { method: 'POST' });
    showToast('新闻采集已启动', 'success');

    // 轮询执行状态
    let elapsed = 0;
    const pollInterval = 3000; // 3秒轮询一次

    _agentPollTimer = setInterval(async () => {
      elapsed += pollInterval;
      try {
        const data = await api('/agent/status');
        const run = data.run;

        if (!run) {
          // 可能还没写入记录
          statusEl.querySelector('.agent-progress-detail').textContent =
            '正在初始化采集任务... (' + Math.round(elapsed/1000) + 's)';
          return;
        }

        if (run.status === 'running') {
          statusEl.querySelector('.agent-progress-detail').textContent =
            '已发现 ' + (run.items_found||0) + ' 条，已保存 ' + (run.items_saved||0) + ' 条... (' + Math.round(elapsed/1000) + 's)';
        } else {
          // 采集完成（success 或 failed）
          clearInterval(_agentPollTimer);
          _agentPollTimer = null;
          setButtonLoading('btnTriggerNews', false);

          if (run.status === 'success') {
            statusEl.innerHTML = `
              <div class="agent-progress" style="background:#f6ffed;border-color:#b7eb8f;">
                <div class="agent-progress-row" style="color:#389e0d;">✓ 采集完成</div>
                <div class="agent-progress-detail">发现 ${run.items_found||0} 条，保存 ${run.items_saved||0} 条到待审核</div>
              </div>
            `;
            showToast('采集完成：发现 ' + (run.items_found||0) + ' 条，保存 ' + (run.items_saved||0) + ' 条', 'success');
          } else {
            statusEl.innerHTML = `
              <div class="agent-progress" style="background:#fff2f0;border-color:#ffccc7;">
                <div class="agent-progress-row" style="color:#cf1322;">✗ 采集失败</div>
                <div class="agent-progress-detail">${(run.error||'未知错误').slice(0,100)}</div>
              </div>
            `;
            showToast('采集失败', 'error');
          }

          // 刷新执行历史和统计
          loadAgentRuns();
          loadAgentStats();
        }
      } catch (e) {
        // 轮询出错，继续尝试
      }

      // 超时保护（5分钟）
      if (elapsed >= 300000) {
        clearInterval(_agentPollTimer);
        _agentPollTimer = null;
        setButtonLoading('btnTriggerNews', false);
        statusEl.innerHTML = `
          <div class="agent-progress" style="background:#fffbe6;border-color:#ffe58f;">
            <div class="agent-progress-row" style="color:#d48806;">采集超时</div>
            <div class="agent-progress-detail">已超过 5 分钟，请稍后刷新查看结果</div>
          </div>
        `;
      }
    }, pollInterval);

  } catch (e) {
    setButtonLoading('btnTriggerNews', false);
    statusEl.innerHTML = `
      <div class="agent-progress" style="background:#fff2f0;border-color:#ffccc7;">
        <div class="agent-progress-row" style="color:#cf1322;">✗ 触发失败</div>
        <div class="agent-progress-detail">${e.message}</div>
      </div>
    `;
    showToast(e.message, 'error');
  }
}

// ================================================================
// 出题智能体 / 定时任务
// ================================================================

/** 加载课程下拉（出题表单） */
async function loadQuestionCourses() {
  try {
    const data = await api('/courses');
    const sel = document.getElementById('qCourseSelect');
    if (!sel) return;
    const list = (data.courses || []).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    sel.innerHTML = '<option value="">全部课程</option>' + list;
  } catch (e) { /* 忽略 */ }
}

/** 切换出题模式显示 */
function onQuestionModeChange() {
  const mode = document.getElementById('qMode').value;
  const isExternal = mode === 'external';
  document.getElementById('qCourseField').style.display = isExternal ? 'none' : '';
  document.getElementById('qExternalField').style.display = isExternal ? '' : 'none';
  document.getElementById('qUrlField').style.display = isExternal ? '' : 'none';
}

/** 触发出题智能体 */
async function triggerQuestionAgent() {
  const btn = document.getElementById('btnTriggerQuestion');
  const statusEl = document.getElementById('questionRunStatus');
  const mode = document.getElementById('qMode').value;
  const count = parseInt(document.getElementById('qCount').value) || 8;
  const courseId = document.getElementById('qCourseSelect').value || '';
  const text = document.getElementById('qText').value.trim();
  const url = document.getElementById('qUrl').value.trim();

  if (mode === 'external' && !text && !url) {
    showToast('外部模式需填写资料文本或 URL', 'error');
    return;
  }

  setButtonLoading('btnTriggerQuestion', true);
  statusEl.innerHTML = `<div class="agent-progress"><div class="agent-progress-row">出题智能体运行中…</div><div class="agent-progress-detail">LLM 正在基于资料生成 ${count} 道题（可能需数十秒）</div></div>`;

  try {
    const res = await api('/agent/trigger/questions', {
      method: 'POST',
      body: JSON.stringify({ count, mode, courseId, text, url })
    });
    showToast(res.message || '已启动出题', 'success');
    pollQuestionStatus();
  } catch (e) {
    setButtonLoading('btnTriggerQuestion', false);
    statusEl.innerHTML = `<div class="agent-progress" style="background:#fff2f0;border-color:#ffccc7;"><div class="agent-progress-row" style="color:#cf1322;">✗ 触发失败</div><div class="agent-progress-detail">${e.message}</div></div>`;
    showToast(e.message, 'error');
  }
}

/** 轮询出题结果 */
let _questionPollTimer = null;
function pollQuestionStatus() {
  if (_questionPollTimer) clearInterval(_questionPollTimer);
  const statusEl = document.getElementById('questionRunStatus');
  const start = Date.now();
  _questionPollTimer = setInterval(async () => {
    try {
      const data = await api('/agent/status');
      const run = data.run;
      if (run && run.agent_type === 'question') {
        if (run.status === 'success') {
          clearInterval(_questionPollTimer); _questionPollTimer = null;
          setButtonLoading('btnTriggerQuestion', false);
          statusEl.innerHTML = `<div class="agent-progress" style="background:#f6ffed;border-color:#b7eb8f;"><div class="agent-progress-row" style="color:#389e0d;">✓ 出题完成</div><div class="agent-progress-detail">生成 ${run.items_saved} 道题，已进入待审核队列</div></div>`;
          showToast('出题完成，请到「待审核」核验', 'success');
          loadAgentStats();
        } else if (run.status === 'failed') {
          clearInterval(_questionPollTimer); _questionPollTimer = null;
          setButtonLoading('btnTriggerQuestion', false);
          statusEl.innerHTML = `<div class="agent-progress" style="background:#fff2f0;border-color:#ffccc7;"><div class="agent-progress-row" style="color:#cf1322;">✗ 出题失败</div><div class="agent-progress-detail">${(run.error||'未知错误').slice(0,120)}</div></div>`;
        }
      }
    } catch (e) {}
    if (Date.now() - start > 180000) {
      clearInterval(_questionPollTimer); _questionPollTimer = null;
      setButtonLoading('btnTriggerQuestion', false);
    }
  }, 4000);
}

/** 触发文献采集 */
async function triggerLiteratureAgent() {
  try {
    const res = await api('/agent/trigger/literature', { method: 'POST' });
    showToast(res.message || '文献采集已启动', 'success');
    loadAgentRuns();
  } catch (e) { showToast(e.message, 'error'); }
}

/** 加载定时任务列表 */
async function loadSchedules() {
  const list = document.getElementById('schedulesList');
  if (!list) return;
  list.innerHTML = '<div class="agent-loading">加载中...</div>';
  try {
    const data = await api('/schedules');
    if (!data.schedules || data.schedules.length === 0) {
      list.innerHTML = '<div style="padding:20px;color:#999">暂无定时任务</div>';
      return;
    }
    const typeName = { news: '新闻采集', literature: '文献采集', question: '智能出题' };
    list.innerHTML = data.schedules.map(s => `
      <div class="schedule-item">
        <div class="schedule-main">
          <div class="schedule-title">${s.name} <span class="tag tag-agent-${s.agent_type}">${typeName[s.agent_type]||s.agent_type}</span></div>
          <div class="schedule-meta">周期: <code>${s.cron}</code> ｜ 状态: ${s.enabled ? '<span style="color:#27ae60">启用</span>' : '<span style="color:#999">停用</span>'}
            ${s.last_run_at ? '｜ 上次: ' + s.last_run_at + ' (' + (s.last_status||'-') + ')' : ''}</div>
          <div class="schedule-note">${s.note||''}</div>
        </div>
        <div class="schedule-actions">
          <button class="btn-sm ${s.enabled ? 'btn-secondary' : 'btn-primary'}" onclick="toggleSchedule('${s.id}', ${s.enabled ? 0 : 1})">${s.enabled ? '停用' : '启用'}</button>
          <button class="btn-sm btn-secondary" onclick="editSchedule('${s.id}', '${s.cron}')">改周期</button>
          <button class="btn-sm btn-secondary" onclick="runScheduleNow('${s.id}')">立即执行</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<div style="padding:20px;color:#ff4d4f">加载失败: ' + e.message + '</div>';
  }
}

/** 开关定时任务 */
async function toggleSchedule(id, enabled) {
  try {
    await api('/schedules/' + id, { method: 'PUT', body: JSON.stringify({ enabled }) });
    showToast(enabled ? '已启用' : '已停用', 'success');
    loadSchedules();
  } catch (e) { showToast(e.message, 'error'); }
}

/** 修改周期 */
async function editSchedule(id, cron) {
  const nv = prompt('输入新的 cron 表达式（如 每天08:00 = "0 8 * * *"，每周一09:00 = "0 9 * * 1"）', cron);
  if (!nv) return;
  try {
    await api('/schedules/' + id, { method: 'PUT', body: JSON.stringify({ cron: nv }) });
    showToast('周期已更新', 'success');
    loadSchedules();
  } catch (e) { showToast(e.message, 'error'); }
}

/** 立即执行 */
async function runScheduleNow(id) {
  try {
    await api('/schedules/' + id + '/run', { method: 'POST' });
    showToast('已触发执行（后台）', 'success');
    loadSchedules();
    loadAgentRuns();
  } catch (e) { showToast(e.message, 'error'); }
}

/** 在 loadAgents 中补充加载课程与定时任务 */
const _origLoadAgents = loadAgents;
loadAgents = async function() {
  _origLoadAgents();
  loadQuestionCourses();
  loadSchedules();
};

// ================================================================
// 用户管理 (简化版)
// ================================================================
async function loadUsers() {
  // 暂时只显示当前用户
  document.getElementById('userList').innerHTML = `
    <div class="content-item">
      <div class="content-item-main">
        <div class="content-item-title">${currentUser.name}</div>
        <div class="content-item-meta">${currentUser.email} | 角色: ${currentUser.role}</div>
      </div>
    </div>
  `;
}

// ================================================================
// 系统设置
// ================================================================
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPwd = document.getElementById('newPassword').value;
  const confirmPwd = document.getElementById('confirmPassword').value;
  if (newPwd !== confirmPwd) { showToast('两次密码不一致', 'error'); return; }
  try {
    await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        oldPassword: document.getElementById('oldPassword').value,
        newPassword: newPwd
      })
    });
    showToast('密码修改成功', 'success');
    e.target.reset();
  } catch (err) { showToast(err.message, 'error'); }
});

async function exportAllData() {
  try {
    const [courses, questions, practice, kg, news] = await Promise.all([
      api('/courses'), api('/questions?all=true'),
      api('/practice'), api('/knowledge'), api('/news')
    ]);
    const allData = { courses: courses.courses, questions: questions.questions, practice: practice.courses, knowledge: kg.graph, news: news.news, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cps-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast('导出成功', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

// ================================================================
// 模态框
// ================================================================
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// ================================================================
// 初始化
// ================================================================
async function init() {
  if (token) {
    try {
      const data = await api('/auth/me');
      currentUser = data.user;
      showAdmin();
    } catch (e) {
      localStorage.removeItem('cps_admin_token');
      token = '';
    }
  }
}
init();
