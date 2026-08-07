/**
 * CPS 三级考试平台 · API 客户端
 * 优先从后端 API 加载数据，降级回退到静态 JS 数据
 */
const CPS_API = (function() {
  const API_BASE = '/api';
  let apiAvailable = false;
  let cache = {};

  /**
   * 检测后端 API 是否可用
   */
  async function checkAvailability() {
    try {
      const res = await fetch(`${API_BASE}/health`, { timeout: 3000 });
      apiAvailable = res.ok;
    } catch (e) {
      apiAvailable = false;
    }
    return apiAvailable;
  }

  /**
   * 通用 API 请求
   */
  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = localStorage.getItem('cps_token');
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `请求失败 (${res.status})`);
    }
    return res.json();
  }

  /**
   * 初始化：检测 API 并加载所有数据
   * 如果 API 可用，用 API 数据覆盖静态全局变量
   */
  async function init() {
    await checkAvailability();
    if (!apiAvailable) {
      console.log('[CPS API] 后端不可用，使用静态数据');
      return false;
    }
    console.log('[CPS API] 后端已连接，加载数据...');
    try {
      await loadAllData();
      return true;
    } catch (e) {
      console.error('[CPS API] 数据加载失败，回退到静态数据', e);
      apiAvailable = false;
      return false;
    }
  }

  /**
   * 从 API 加载所有数据并覆盖全局变量
   */
  async function loadAllData() {
    const [coursesRes, questionsRes, practiceRes, kgRes] = await Promise.all([
      request('/courses'),
      request('/questions?all=true'),
      request('/practice'),
      request('/knowledge')
    ]);

    // 覆盖全局变量（保持与静态数据相同的结构）
    if (typeof THEORY_COURSES !== 'undefined') {
      const theoryCourses = coursesRes.courses
        .filter(c => c.type === 'theory')
        .map(c => ({
          id: c.id, title: c.title, tag: c.tag, color: c.color, icon: c.icon,
          desc: c.description, chapters: c.content || []
        }));
      THEORY_COURSES = theoryCourses;
    }

    if (typeof PRACTICE_COURSES !== 'undefined') {
      const practiceCourses = coursesRes.courses
        .filter(c => c.type === 'practice')
        .map(c => ({
          id: c.id, title: c.title, tag: c.tag, color: c.color, icon: c.icon,
          desc: c.description, chapters: c.content || []
        }));
      PRACTICE_COURSES = practiceCourses;
    }

    // 重建题库
    if (typeof QUESTION_BANK !== 'undefined') {
      const bank = {};
      questionsRes.questions.forEach(q => {
        if (!bank[q.category]) bank[q.category] = [];
        bank[q.category].push({
          id: q.id, q: q.question, options: q.options || [],
          answer: q.answer, exp: q.explanation, src: q.source,
          diff: q.difficulty, weight: q.weight
        });
      });
      QUESTION_BANK = bank;
    }

    // 重建练习卡
    if (typeof PRACTICE_CARDS !== 'undefined') {
      PRACTICE_CARDS = practiceRes.courses.map(c => ({
        courseId: c.courseId, courseTitle: c.courseTitle,
        courseTag: c.courseTag, courseColor: c.courseColor,
        topics: c.topics
      }));
    }

    // 重建知识图谱
    if (typeof KNOWLEDGE_GRAPH !== 'undefined') {
      KNOWLEDGE_GRAPH = kgRes.graph;
    }

    console.log('[CPS API] 数据加载完成',
      `课程: ${coursesRes.courses.length}, 题库: ${questionsRes.questions.length}`);
  }

  // ================================================================
  // Auth API
  // ================================================================
  async function login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('cps_token', data.token);
    localStorage.setItem('cps_user', JSON.stringify(data.user));
    return data.user;
  }

  async function register(email, password, name) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    localStorage.setItem('cps_token', data.token);
    localStorage.setItem('cps_user', JSON.stringify(data.user));
    return data.user;
  }

  function logout() {
    localStorage.removeItem('cps_token');
    localStorage.removeItem('cps_user');
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('cps_user'));
    } catch (e) { return null; }
  }

  function isLoggedIn() {
    return !!localStorage.getItem('cps_token');
  }

  function isAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'editor');
  }

  /**
   * 获取当前 token（供 AI Chat 等模块使用）
   */
  function getToken() {
    return localStorage.getItem('cps_token');
  }

  return {
    init, checkAvailability, request,
    isApiAvailable: () => apiAvailable,
    login, register, logout, getCurrentUser, isLoggedIn, isAdmin, getToken
  };
})();
