/**
 * CPS 三级考试平台 · 用户认证 UI 模块
 * 提供登录/注册弹窗、用户状态显示、管理后台入口
 */
const AuthUI = (function() {

  /**
   * 初始化：在导航栏添加用户区域
   */
  function init() {
    injectNavbarAuth();
    updateUI();
  }

  /**
   * 在导航栏注入认证 UI
   */
  function injectNavbarAuth() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    // 检查是否已注入
    if (document.getElementById('authArea')) return;

    const authArea = document.createElement('div');
    authArea.id = 'authArea';
    authArea.className = 'auth-area';
    navRight.appendChild(authArea);
  }

  /**
   * 更新 UI 状态
   */
  function updateUI() {
    const area = document.getElementById('authArea');
    if (!area) return;

    const user = CPS_API.getCurrentUser();
    if (user) {
      area.innerHTML = `
        <div class="auth-user" onclick="AuthUI.toggleMenu(event)">
          <span class="auth-avatar">${user.name.charAt(0).toUpperCase()}</span>
          <span class="auth-name">${user.name}</span>
          <span class="auth-arrow">▼</span>
        </div>
        <div class="auth-dropdown" id="authDropdown" style="display:none">
          <div class="auth-dropdown-header">
            <div class="auth-dd-name">${user.name}</div>
            <div class="auth-dd-email">${user.email}</div>
            <span class="auth-dd-role tag-${user.role}">${roleName(user.role)}</span>
          </div>
          ${CPS_API.isAdmin() ? '<a href="/admin" class="auth-dd-item">⚙️ 管理后台</a>' : ''}
          <a href="#/profile" class="auth-dd-item" onclick="AuthUI.closeMenu()">👤 个人中心</a>
          <a href="javascript:void(0)" class="auth-dd-item auth-dd-logout" onclick="AuthUI.logout()">🚪 退出登录</a>
        </div>
      `;
    } else {
      area.innerHTML = `
        <button class="auth-btn auth-btn-login" onclick="AuthUI.openModal('login')">登录</button>
        <button class="auth-btn auth-btn-register" onclick="AuthUI.openModal('register')">注册</button>
      `;
    }
  }

  function roleName(role) {
    return { admin: '管理员', editor: '编辑', user: '学员' }[role] || role;
  }

  /**
   * 切换下拉菜单
   */
  function toggleMenu(e) {
    e.stopPropagation();
    const dd = document.getElementById('authDropdown');
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  }

  function closeMenu() {
    const dd = document.getElementById('authDropdown');
    if (dd) dd.style.display = 'none';
  }

  // 点击外部关闭
  document.addEventListener('click', () => closeMenu());

  /**
   * 打开登录/注册弹窗
   */
  function openModal(mode) {
    closeModal();
    const isLogin = mode === 'login';
    const overlay = document.createElement('div');
    overlay.id = 'authModal';
    overlay.className = 'auth-modal-overlay';
    overlay.innerHTML = `
      <div class="auth-modal" onclick="event.stopPropagation()">
        <button class="auth-modal-close" onclick="AuthUI.closeModal()">✕</button>
        <div class="auth-modal-logo">🧠</div>
        <h2>${isLogin ? '登录' : '注册'}</h2>
        <p class="auth-modal-subtitle">${isLogin ? '欢迎回来，继续你的备考之旅' : '创建账号，开启系统化备考'}</p>
        <form id="authForm">
          ${!isLogin ? `<div class="auth-field"><label>姓名</label><input type="text" name="name" required placeholder="你的姓名"></div>` : ''}
          <div class="auth-field"><label>邮箱</label><input type="email" name="email" required placeholder="邮箱地址"></div>
          <div class="auth-field"><label>密码</label><input type="password" name="password" required placeholder="${isLogin ? '密码' : '至少6位'}" minlength="${isLogin ? 1 : 6}"></div>
          <div id="authError" class="auth-error"></div>
          <button type="submit" class="auth-submit">${isLogin ? '登 录' : '注 册'}</button>
        </form>
        <div class="auth-switch">
          ${isLogin
            ? '还没有账号？<a href="javascript:void(0)" onclick="AuthUI.openModal(\'register\')">立即注册</a>'
            : '已有账号？<a href="javascript:void(0)" onclick="AuthUI.openModal(\'login\')">去登录</a>'}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = fd.get('email');
      const password = fd.get('password');
      const name = fd.get('name');
      const errEl = document.getElementById('authError');
      errEl.textContent = '';

      try {
        const btn = e.target.querySelector('.auth-submit');
        btn.disabled = true;
        btn.textContent = '处理中...';

        let user;
        if (isLogin) {
          user = await CPS_API.login(email, password);
        } else {
          user = await CPS_API.register(email, password, name);
        }
        closeModal();
        updateUI();
        showToast(isLogin ? `欢迎回来，${user.name}！` : `注册成功，欢迎 ${user.name}！`, 'success');
      } catch (err) {
        errEl.textContent = err.message;
        const btn = e.target.querySelector('.auth-submit');
        btn.disabled = false;
        btn.textContent = isLogin ? '登 录' : '注 册';
      }
    });
  }

  function closeModal() {
    const m = document.getElementById('authModal');
    if (m) m.remove();
  }

  /**
   * 退出登录
   */
  function logout() {
    CPS_API.logout();
    updateUI();
    showToast('已退出登录', 'info');
    if (location.hash === '#/profile') location.hash = '#/';
  }

  /**
   * Toast 提示
   */
  function showToast(msg, type = '') {
    let toast = document.getElementById('cpsToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cpsToast';
      toast.className = 'cps-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'cps-toast ' + type;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
  }

  return { init, updateUI, openModal, closeModal, logout, toggleMenu, closeMenu };
})();
