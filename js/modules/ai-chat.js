/**
 * AI 答疑助手模块
 * 悬浮对话框 + DeepSeek API 流式调用 + 题目上下文注入
 * 系统提示词设定为资深心理学培训导师，回答基于指定教材
 */
const AIChat = (function() {
  'use strict';

  /* ===== 配置 ===== */
  var API_URL = 'https://api.deepseek.com/chat/completions';
  var MODEL = 'deepseek-chat';
  var STORAGE_KEY = 'cps_deepseek_api_key';
  var MAX_HISTORY = 20;
  var POS_KEY = 'cps_ai_panel_pos';
  var SIZE_KEY = 'cps_ai_panel_size';
  var DOCK_KEY = 'cps_ai_panel_docked';
  var MIN_WIDTH = 300;
  var MIN_HEIGHT = 380;
  var DOCK_WIDTH = 380;

  /* ===== 系统提示词 ===== */
  var SYSTEM_PROMPT = [
    '你是一位资深的心理学培训导师，对CPS（中国心理学会）三级心理咨询师水平评价考试具有丰富的培训和备考经验，精通心理学理论与实务知识。',
    '',
    '【教材依据】',
    '你的回答必须严格基于以下权威教材：',
    '1.《心理咨询基础培训教材·理论知识》——心理学综合科目唯一命题来源',
    '2.《心理咨询基础培训教材·咨询实务》——咨询实务科目命题来源',
    '3.《中国心理学会临床与咨询心理学专业机构和专业人员伦理守则》',
    '',
    '【课程体系】',
    '基础理论6门：心理学导论、社会心理学、人格心理学、发展心理学、异常心理学、咨询心理学',
    '三级实务8门：心理测量与评估、通用技术、认知行为治疗(CBT)、人本主义、团体辅导、伦理实务、危机干预、实务练习',
    '',
    '【教材要点提示】',
    '心理学导论：心理学研究对象与方法、感知觉、记忆、思维、情绪与动机',
    '社会心理学：社会化、社会认知、人际关系、群体心理、社会影响',
    '人格心理学：精神分析/特质/人本/认知/生物学派人格理论、人格测量',
    '发展心理学：皮亚杰认知发展理论、埃里克森心理社会发展阶段、语言发展',
    '异常心理学：异常心理分类与诊断标准、焦虑障碍、心境障碍、精神分裂症、人格障碍',
    '咨询心理学：心理咨询发展历程、咨询目标与阶段、咨询关系建立',
    '心理测量与评估：SCL-90、MMPI、SDS、SAS、韦氏智力量表、信效度',
    '通用技术：倾听、提问、共情、反映、面质、解释、自我暴露、即时性',
    'CBT：自动思维、认知扭曲类型、认知重构、行为激活、暴露技术',
    '人本主义：罗杰斯三大条件（无条件积极关注、真诚一致、共情）',
    '团体辅导：团体发展阶段、团体类型、领导技术、团体效果评估',
    '伦理实务：保密原则及例外、知情同意、双重关系、胜任力、伦理困境处理',
    '危机干预：危机评估六步模型、自杀风险评估、危机干预技术',
    '实务练习：初诊接待、个案概念化、咨询计划制定、咨询记录',
    '',
    '【回答要求】',
    '1. 所有知识点必须来源于上述教材，绝不允许杜撰',
    '2. 解释要专业、详细、准确，适合备考CPS三级考试的学生',
    '3. 对于题目答疑，请按以下结构回答：',
    '   - 先给出正确答案',
    '   - 逐项分析每个选项的对错及原因',
    '   - 相关知识点拓展',
    '   - 标注教材来源章节',
    '4. 概念辨析时，要清晰对比异同点，可用表格或列表形式',
    '5. 如果问题超出教材范围，明确告知并建议查阅相关教材',
    '6. 使用中文回答，格式清晰，适当使用加粗和列表',
    '7. 回答长度适中，重点突出，避免冗长'
  ].join('\n');

  /* ===== 状态 ===== */
  var apiKey = localStorage.getItem(STORAGE_KEY) || '';
  var chatHistory = [];
  var contextData = null;
  var isStreaming = false;
  var abortController = null;
  var initialized = false;
  var isDragging = false;
  var isResizing = false;

  /* ===== DOM 引用 ===== */
  var fab, panel, mask, messagesEl, inputEl, sendBtn, settingsPanel, contextBar;

  /* ===== 初始化 ===== */
  function init() {
    if (initialized) return;
    initialized = true;
    createElements();
    attachListeners();
  }

  function createElements() {
    /* 悬浮按钮 */
    fab = document.createElement('div');
    fab.className = 'ai-fab';
    fab.id = 'aiFab';
    fab.innerHTML = '<div class="ai-fab-pulse"></div><span class="ai-fab-text">AI</span>';
    fab.title = 'AI 答疑助手';
    document.body.appendChild(fab);

    /* 遮罩层（移动端） */
    mask = document.createElement('div');
    mask.className = 'ai-chat-mask';
    document.body.appendChild(mask);

    /* 聊天面板 */
    panel = document.createElement('div');
    panel.className = 'ai-chat-panel';
    panel.innerHTML =
      '<div class="ai-chat-header">' +
        '<div class="ai-chat-title">' +
          '<span class="ai-chat-avatar">AI</span>' +
          '<div>' +
            '<div class="ai-chat-name">AI 答疑助手</div>' +
            '<div class="ai-chat-subtitle">基于教材 · 专业答疑</div>' +
          '</div>' +
        '</div>' +
        '<div class="ai-chat-actions">' +
          '<button class="ai-header-btn" id="aiDockBtn" title="停靠为侧边栏">📍</button>' +
          '<button class="ai-header-btn" id="aiNewChatBtn" title="新对话">⟳</button>' +
          '<button class="ai-header-btn" id="aiSettingsBtn" title="设置 API Key">⚙</button>' +
          '<button class="ai-header-btn ai-close-btn" id="aiCloseBtn" title="关闭">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="ai-context-bar" id="aiContextBar" style="display:none;">' +
        '<span class="ai-context-icon">📌</span>' +
        '<span class="ai-context-text" id="aiContextText"></span>' +
      '</div>' +
      '<div class="ai-chat-messages" id="aiMessages">' +
        '<div class="ai-welcome">' +
          '<div class="ai-welcome-icon">🧠</div>' +
          '<h3>AI 答疑助手</h3>' +
          '<p>你好！我是基于 DeepSeek 的 AI 答疑助手，专精 CPS 三级心理咨询师考试辅导。可以帮你：</p>' +
          '<ul>' +
            '<li><strong>📝 题目解析</strong>：在测试题旁点击「AI答疑」即可获取详细解析</li>' +
            '<li><strong>🔍 知识检索</strong>：输入心理学概念，获取教材级解释</li>' +
            '<li><strong>💡 概念辨析</strong>：对比易混淆概念，如「共情 vs 同情」</li>' +
            '<li><strong>📋 备考建议</strong>：针对薄弱环节提供复习策略</li>' +
          '</ul>' +
          '<div class="ai-welcome-note">所有回答基于《心理咨询基础培训教材》编写，不杜撰。</div>' +
        '</div>' +
      '</div>' +
      '<div class="ai-chat-input-area">' +
        '<textarea id="aiInput" class="ai-input" placeholder="输入你的问题... (Enter发送, Shift+Enter换行)" rows="1"></textarea>' +
        '<button id="aiSendBtn" class="ai-send-btn">发送</button>' +
      '</div>';
    document.body.appendChild(panel);

    /* Resize handles (8-direction, desktop only) */
    var handles = [
      { dir: 'n', cls: 'ai-rz-n', cur: 'ns-resize' },
      { dir: 's', cls: 'ai-rz-s', cur: 'ns-resize' },
      { dir: 'w', cls: 'ai-rz-w', cur: 'ew-resize' },
      { dir: 'e', cls: 'ai-rz-e', cur: 'ew-resize' },
      { dir: 'nw', cls: 'ai-rz-nw', cur: 'nwse-resize' },
      { dir: 'ne', cls: 'ai-rz-ne', cur: 'nesw-resize' },
      { dir: 'sw', cls: 'ai-rz-sw', cur: 'nesw-resize' },
      { dir: 'se', cls: 'ai-rz-se', cur: 'nwse-resize' }
    ];
    handles.forEach(function(h) {
      var el = document.createElement('div');
      el.className = 'ai-resize-handle ' + h.cls;
      el.style.cursor = h.cur;
      el.dataset.dir = h.dir;
      panel.appendChild(el);
    });

    /* 设置面板 */
    settingsPanel = document.createElement('div');
    settingsPanel.className = 'ai-settings-overlay';
    settingsPanel.innerHTML =
      '<div class="ai-settings-box">' +
        '<h3>DeepSeek API 设置</h3>' +
        '<p>请输入你的 DeepSeek API Key，用于启用 AI 答疑功能。Key 仅保存在本地浏览器中，不会上传。</p>' +
        '<input type="password" id="apiKeyInput" class="ai-api-input" placeholder="sk-..." value="' + escapeAttr(apiKey) + '">' +
        '<div class="ai-settings-hint">' +
          '获取 API Key：访问 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">platform.deepseek.com</a>' +
        '</div>' +
        '<div class="ai-settings-buttons">' +
          '<button id="aiSettingsSave" class="btn btn-primary">保存</button>' +
          '<button id="aiSettingsCancel" class="btn btn-outline">取消</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(settingsPanel);

    /* 缓存 DOM 引用 */
    messagesEl = document.getElementById('aiMessages');
    inputEl = document.getElementById('aiInput');
    sendBtn = document.getElementById('aiSendBtn');
    contextBar = document.getElementById('aiContextBar');
  }

  function attachListeners() {
    fab.addEventListener('click', toggle);
    mask.addEventListener('click', close);
    document.getElementById('aiCloseBtn').addEventListener('click', close);
    document.getElementById('aiDockBtn').addEventListener('click', toggleDock);
    document.getElementById('aiSettingsBtn').addEventListener('click', openSettings);
    document.getElementById('aiNewChatBtn').addEventListener('click', newChat);
    document.getElementById('aiSettingsSave').addEventListener('click', saveApiKey);
    document.getElementById('aiSettingsCancel').addEventListener('click', closeSettings);
    sendBtn.addEventListener('click', handleSend);

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    /* 输入框自适应高度 */
    inputEl.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    initDrag();
    initResize();
  }

  /* ===== 面板控制 ===== */
  function toggle() {
    if (panel.classList.contains('show')) close();
    else open();
  }

  function open() {
    /* 恢复停靠状态 */
    var docked = localStorage.getItem(DOCK_KEY) === '1';
    if (docked && !panel.classList.contains('docked')) {
      dock();
    } else if (!docked) {
      restoreState();
    }
    panel.classList.add('show');
    fab.classList.add('hide');
    if (window.innerWidth < 768) mask.classList.add('show');
    setTimeout(function() { inputEl.focus(); }, 300);
  }

  function close() {
    panel.classList.remove('show');
    fab.classList.remove('hide');
    mask.classList.remove('show');
  }

  /* ===== 停靠/浮动切换 ===== */
  function toggleDock() {
    if (panel.classList.contains('docked')) {
      undock();
    } else {
      dock();
    }
  }

  function dock() {
    /* 保存当前浮动状态用于恢复 */
    if (panel.classList.contains('positioned')) {
      var rect = panel.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        localStorage.setItem(SIZE_KEY, JSON.stringify({ w: rect.width, h: rect.height }));
        localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
      }
    }
    panel.classList.add('docked');
    panel.classList.remove('positioned');
    panel.style.left = '';
    panel.style.top = '';
    panel.style.width = '';
    panel.style.height = '';
    panel.style.right = '';
    panel.style.bottom = '';
    document.body.classList.add('ai-docked-body');
    localStorage.setItem(DOCK_KEY, '1');

    /* 更新按钮图标和提示 */
    var btn = document.getElementById('aiDockBtn');
    if (btn) {
      btn.textContent = '↗';
      btn.title = '取消停靠，恢复浮动模式';
      btn.classList.add('ai-dock-active');
    }
  }

  function undock() {
    panel.classList.remove('docked');
    document.body.classList.remove('ai-docked-body');
    localStorage.setItem(DOCK_KEY, '0');

    /* 恢复之前保存的浮动位置/尺寸 */
    restoreState();

    /* 更新按钮图标和提示 */
    var btn = document.getElementById('aiDockBtn');
    if (btn) {
      btn.textContent = '📍';
      btn.title = '停靠为侧边栏';
      btn.classList.remove('ai-dock-active');
    }
  }

  function newChat() {
    chatHistory = [];
    contextData = null;
    contextBar.style.display = 'none';
    messagesEl.innerHTML =
      '<div class="ai-welcome">' +
        '<div class="ai-welcome-icon">🧠</div>' +
        '<h3>AI 答疑助手</h3>' +
        '<p>新对话已开始，请输入你的问题。</p>' +
      '</div>';
    inputEl.focus();
  }

  /* ===== 设置 ===== */
  function openSettings() {
    settingsPanel.classList.add('show');
    var input = document.getElementById('apiKeyInput');
    if (input) input.focus();
  }

  function closeSettings() {
    settingsPanel.classList.remove('show');
  }

  function saveApiKey() {
    var input = document.getElementById('apiKeyInput');
    apiKey = (input.value || '').trim();
    if (apiKey) {
      localStorage.setItem(STORAGE_KEY, apiKey);
      closeSettings();
      newChat();
    }
  }

  /* ===== 上下文 ===== */
  function setContext(data) {
    contextData = data;
    if (data && data.question) {
      var shortQ = data.question.length > 40 ? data.question.substring(0, 40) + '...' : data.question;
      document.getElementById('aiContextText').textContent = '关联题目：' + shortQ;
      contextBar.style.display = 'flex';
    } else {
      contextBar.style.display = 'none';
    }
  }

  function askFromQuiz(questionData) {
    setContext(questionData);
    open();
    setTimeout(function() {
      send('请帮我详细解析这道题，给出正确答案，逐项分析每个选项的对错原因，并标注教材来源章节。');
    }, 400);
  }

  function buildContextMessage(text) {
    if (!contextData) return text;
    var ctx = '【当前题目】\n';
    if (contextData.type) ctx += '题型：' + contextData.type + '\n';
    if (contextData.question) ctx += '题目：' + contextData.question + '\n';
    if (contextData.options && contextData.options.length) {
      ctx += '选项：\n';
      contextData.options.forEach(function(opt, i) {
        ctx += String.fromCharCode(65 + i) + '. ' + opt + '\n';
      });
    }
    if (contextData.source) ctx += '教材来源：' + contextData.source + '\n';
    ctx += '\n【我的问题】\n' + text;
    return ctx;
  }

  /* ===== 发送消息 ===== */
  function handleSend() {
    var text = inputEl.value.trim();
    if (!text) return;

    if (!apiKey) {
      openSettings();
      return;
    }

    if (isStreaming) {
      /* 停止生成 */
      if (abortController) abortController.abort();
      return;
    }

    send(text);
  }

  function send(text) {
    if (!apiKey) {
      openSettings();
      return;
    }

    /* 移除欢迎语 */
    var welcome = messagesEl.querySelector('.ai-welcome');
    if (welcome) welcome.remove();

    /* 添加用户消息 */
    addMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';

    /* 构建上下文消息 */
    var userContent = buildContextMessage(text);
    chatHistory.push({ role: 'user', content: userContent });

    /* 裁剪历史 */
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory = chatHistory.slice(-MAX_HISTORY);
    }

    /* 创建 AI 消息占位 */
    var assistantEl = addMessage('assistant', '');
    var textEl = assistantEl.querySelector('.ai-msg-text');
    textEl.innerHTML = '<span class="ai-typing"><span></span><span></span><span></span></span>';

    isStreaming = true;
    sendBtn.textContent = '停止';
    sendBtn.classList.add('stop');
    scrollToBottom();

    abortController = new AbortController();
    var fullText = '';

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(chatHistory),
        stream: true,
        max_tokens: 2048,
        temperature: 0.3
      }),
      signal: abortController.signal
    }).then(function(response) {
      if (!response.ok) {
        return response.json().then(function(errData) {
          throw new Error(errData.error ? errData.error.message : 'API 请求失败 (HTTP ' + response.status + ')');
        }).catch(function() {
          throw new Error('API 请求失败 (HTTP ' + response.status + ')');
        });
      }

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      function readChunk() {
        reader.read().then(function(chunk) {
          if (chunk.done) {
            /* 完成 */
            finishStreaming(fullText, textEl, userContent);
            return;
          }
          buffer += decoder.decode(chunk.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line.indexOf('data: ') !== 0) continue;
            var data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              var json = JSON.parse(data);
              var delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
              if (delta) {
                fullText += delta;
                textEl.innerHTML = formatMarkdown(fullText);
                scrollToBottom();
              }
            } catch (e) { /* skip */ }
          }
          readChunk();
        }).catch(function(err) {
          if (err.name === 'AbortError') {
            finishStreaming(fullText, textEl, userContent, true);
          } else {
            handleStreamError(err, textEl, userContent);
          }
        });
      }
      readChunk();
    }).catch(function(err) {
      if (err.name === 'AbortError') {
        finishStreaming(fullText, textEl, userContent, true);
      } else {
        handleStreamError(err, textEl, userContent);
      }
    });
  }

  function finishStreaming(fullText, textEl, userContent, aborted) {
    if (!fullText) {
      textEl.innerHTML = '<span style="color:var(--text-secondary)">（回复为空）</span>';
    } else {
      textEl.innerHTML = formatMarkdown(fullText);
      if (aborted) {
        textEl.innerHTML += '<div style="color:var(--text-secondary);font-size:12px;margin-top:8px;">（已停止生成）</div>';
      }
      chatHistory.push({ role: 'assistant', content: fullText });
    }
    /* 用完后清除题目上下文 */
    if (contextData) {
      contextData = null;
      contextBar.style.display = 'none';
    }
    isStreaming = false;
    sendBtn.textContent = '发送';
    sendBtn.classList.remove('stop');
    abortController = null;
    scrollToBottom();
  }

  function handleStreamError(err, textEl, userContent) {
    var msg = err.message || err.toString();
    textEl.innerHTML = '<span style="color:var(--danger);">⚠ ' + escapeHtml(msg) + '</span>';
    if (msg.indexOf('API key') >= 0 || msg.indexOf('401') >= 0 || msg.indexOf('Authentication') >= 0 || msg.indexOf('authorization') >= 0) {
      textEl.innerHTML += '<div style="margin-top:8px;"><button class="btn btn-outline btn-sm" onclick="AIChat.openSettings()">设置 API Key</button></div>';
    }
    if (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0) {
      textEl.innerHTML += '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">可能是网络问题或 CORS 限制，请检查 API 地址是否正确。</div>';
    }
    /* 移除失败的用户消息 */
    chatHistory = chatHistory.filter(function(m) { return m.content !== userContent; });
    isStreaming = false;
    sendBtn.textContent = '发送';
    sendBtn.classList.remove('stop');
    abortController = null;
    scrollToBottom();
  }

  /* ===== 消息渲染 ===== */
  function addMessage(role, content) {
    var div = document.createElement('div');
    div.className = 'ai-message ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-bot');

    if (role === 'user') {
      div.innerHTML =
        '<div class="ai-msg-bubble ai-msg-bubble-user">' +
          '<div class="ai-msg-text">' + escapeHtml(content) + '</div>' +
        '</div>' +
        '<div class="ai-msg-avatar ai-msg-avatar-user">我</div>';
    } else {
      div.innerHTML =
        '<div class="ai-msg-avatar ai-msg-avatar-bot">AI</div>' +
        '<div class="ai-msg-bubble ai-msg-bubble-bot">' +
          '<div class="ai-msg-text">' + (content || '') + '</div>' +
        '</div>';
    }
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ===== Markdown 渲染 ===== */
  function formatMarkdown(text) {
    if (!text) return '';

    /* 转义 HTML */
    var html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /* 代码块 — 先提取，避免内容被其他规则误处理 */
    var codeBlocks = [];
    html = html.replace(/```([\s\S]*?)```/g, function(m, code) {
      codeBlocks.push(code);
      return '\x00CB' + (codeBlocks.length - 1) + '\x00';
    });

    /* 行内代码 */
    html = html.replace(/`([^`\n]+)`/g, function(m, code) {
      return '\x00IC\x00' + code + '\x00EIC\x00';
    });

    /* 表格提取 — 需要表头行 + 分隔行 + 至少一行数据 */
    var tables = [];
    html = html.replace(/^(\|.+\|)\n(\|[\s\-:|]+\|)\n((?:\|.+\|\n*)+)/gm, function(match, headerRow, sepRow, bodyRows) {
      var aligns = parseTableAlign(sepRow);
      var headers = parseTableRow(headerRow);
      var rows = [];
      bodyRows.trim().split('\n').forEach(function(r) {
        if (r.trim()) rows.push(parseTableRow(r));
      });
      var t = '<div class="ai-md-table-wrap"><table class="ai-md-table"><thead><tr>';
      headers.forEach(function(h, i) {
        var a = aligns[i] || 'left';
        t += '<th style="text-align:' + a + '">' + h + '</th>';
      });
      t += '</tr></thead><tbody>';
      rows.forEach(function(cells) {
        t += '<tr>';
        headers.forEach(function(_, i) {
          var a = aligns[i] || 'left';
          t += '<td style="text-align:' + a + '">' + (cells[i] !== undefined ? cells[i] : '') + '</td>';
        });
        t += '</tr>';
      });
      t += '</tbody></table></div>';
      tables.push(t);
      return '\x00TBL' + (tables.length - 1) + '\x00';
    });

    /* 标题 */
    html = html.replace(/^#### (.+)$/gm, '\x00H6\x00$1\x00ENDH6\x00');
    html = html.replace(/^### (.+)$/gm, '\x00H5\x00$1\x00ENDH5\x00');
    html = html.replace(/^## (.+)$/gm, '\x00H4\x00$1\x00ENDH4\x00');
    html = html.replace(/^# (.+)$/gm, '\x00H3\x00$1\x00ENDH3\x00');

    /* 水平线 */
    html = html.replace(/^[\-\*_]{3,}$/gm, '\x00HR\x00');

    /* 引用块 */
    html = html.replace(/^&gt; (.+)$/gm, '\x00QUOTE\x00$1\x00ENDQ\x00');

    /* 加粗 */
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    /* 斜体 */
    html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

    /* 逐行处理列表 */
    var lines = html.split('\n');
    var result = [];
    var inList = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^[\-\*] /.test(line)) {
        if (!inList) { result.push('<ul class="ai-md-list">'); inList = true; }
        result.push('<li>' + line.replace(/^[\-\*] /, '') + '</li>');
      } else if (/^\d+[\.、] /.test(line)) {
        if (!inList) { result.push('<ol class="ai-md-olist">'); inList = 'ol'; }
        result.push('<li>' + line.replace(/^\d+[\.、] /, '') + '</li>');
      } else {
        if (inList) { result.push(inList === 'ol' ? '</ol>' : '</ul>'); inList = false; }
        result.push(line);
      }
    }
    if (inList) result.push(inList === 'ol' ? '</ol>' : '</ul>');
    html = result.join('\n');

    /* 换行 */
    html = html.replace(/\n/g, '<br>');

    /* 还原占位符为 HTML 标签 */
    html = html.replace(/\x00H3\x00/g, '<div class="ai-md-h3">');
    html = html.replace(/\x00ENDH3\x00/g, '</div>');
    html = html.replace(/\x00H4\x00/g, '<div class="ai-md-h4">');
    html = html.replace(/\x00ENDH4\x00/g, '</div>');
    html = html.replace(/\x00H5\x00/g, '<div class="ai-md-h5">');
    html = html.replace(/\x00ENDH5\x00/g, '</div>');
    html = html.replace(/\x00H6\x00/g, '<div class="ai-md-h6">');
    html = html.replace(/\x00ENDH6\x00/g, '</div>');
    html = html.replace(/\x00HR\x00/g, '<hr class="ai-md-hr">');
    html = html.replace(/\x00QUOTE\x00/g, '<blockquote class="ai-md-quote">');
    html = html.replace(/\x00ENDQ\x00/g, '</blockquote>');

    /* 清理：块级元素后的多余 <br> */
    html = html.replace(/(<\/div>)<br>/g, '$1');
    html = html.replace(/(<\/ul>)<br>/g, '$1');
    html = html.replace(/(<\/ol>)<br>/g, '$1');
    html = html.replace(/<br>(<ul)/g, '$1');
    html = html.replace(/<br>(<ol)/g, '$1');
    html = html.replace(/(<\/li>)<br>(?=<li>)/g, '$1');
    html = html.replace(/<br>(<div class="ai-md-h)/g, '$1');
    html = html.replace(/(<\/blockquote>)<br>/g, '$1');
    html = html.replace(/<br>(<blockquote)/g, '$1');
    html = html.replace(/<hr class="ai-md-hr"><br>/g, '<hr class="ai-md-hr">');
    html = html.replace(/<br>(<hr)/g, '$1');

    /* 代码块还原 */
    html = html.replace(/\x00CB(\d+)\x00/g, function(m, idx) {
      return '<pre class="ai-code-block"><code>' + codeBlocks[parseInt(idx)] + '</code></pre>';
    });
    html = html.replace(/\x00IC\x00([\s\S]*?)\x00EIC\x00/g, '<code class="ai-code-inline">$1</code>');
    html = html.replace(/(<\/pre>)<br>/g, '$1');
    html = html.replace(/<br>(<pre)/g, '$1');

    /* 表格还原 */
    html = html.replace(/\x00TBL(\d+)\x00/g, function(m, idx) {
      return tables[parseInt(idx)];
    });
    html = html.replace(/(<\/div>)<br>(?=<div class="ai-md-table-wrap")/g, '$1');
    html = html.replace(/<br>(<div class="ai-md-table-wrap")/g, '$1');

    return html;
  }

  /* 解析表格行 → 单元格数组 */
  function parseTableRow(line) {
    var trimmed = line.trim();
    if (trimmed.charAt(0) === '|') trimmed = trimmed.substring(1);
    if (trimmed.charAt(trimmed.length - 1) === '|') trimmed = trimmed.substring(0, trimmed.length - 1);
    return trimmed.split('|').map(function(c) { return c.trim(); });
  }

  /* 解析分隔行 → 对齐方式数组 */
  function parseTableAlign(sepRow) {
    var cells = parseTableRow(sepRow);
    return cells.map(function(c) {
      c = c.trim();
      if (c.charAt(0) === ':' && c.charAt(c.length - 1) === ':') return 'center';
      if (c.charAt(0) === ':') return 'left';
      if (c.charAt(c.length - 1) === ':') return 'right';
      return 'left';
    });
  }

  /* ===== 工具函数 ===== */
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ===== 拖拽移动 ===== */
  function initDrag() {
    var header = panel.querySelector('.ai-chat-header');
    header.title = '拖拽移动 · 双击重置位置';

    header.addEventListener('mousedown', function(e) {
      if (e.target.closest('.ai-header-btn')) return;
      if (window.innerWidth < 768) return;
      if (panel.classList.contains('docked')) return;
      e.preventDefault();

      var rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.classList.add('positioned');
      header.classList.add('dragging');

      isDragging = true;
      var startX = e.clientX, startY = e.clientY;
      var startLeft = rect.left, startTop = rect.top;

      function onMove(ev) {
        var nl = startLeft + (ev.clientX - startX);
        var nt = startTop + (ev.clientY - startY);
        nl = Math.max(0, Math.min(nl, window.innerWidth - 80));
        nt = Math.max(0, Math.min(nt, window.innerHeight - 50));
        panel.style.left = nl + 'px';
        panel.style.top = nt + 'px';
      }

      function onUp() {
        isDragging = false;
        header.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        var l = parseInt(panel.style.left) || 0;
        var t = parseInt(panel.style.top) || 0;
        localStorage.setItem(POS_KEY, JSON.stringify({ left: l, top: t }));
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    /* 双击重置位置和尺寸 */
    header.addEventListener('dblclick', function(e) {
      if (e.target.closest('.ai-header-btn')) return;
      if (panel.classList.contains('docked')) return;
      panel.style.left = '';
      panel.style.top = '';
      panel.style.width = '';
      panel.style.height = '';
      panel.style.right = '';
      panel.style.bottom = '';
      panel.classList.remove('positioned');
      localStorage.removeItem(POS_KEY);
      localStorage.removeItem(SIZE_KEY);
    });
  }

  /* ===== 缩放尺寸 ===== */
  function initResize() {
    var handles = panel.querySelectorAll('.ai-resize-handle');
    handles.forEach(function(handle) {
      handle.addEventListener('mousedown', function(e) {
        if (window.innerWidth < 768) return;
        if (panel.classList.contains('docked')) return;
        e.preventDefault();
        e.stopPropagation();

        var dir = handle.dataset.dir;
        isResizing = true;
        var startX = e.clientX, startY = e.clientY;
        var rect = panel.getBoundingClientRect();
        var startW = rect.width, startH = rect.height;
        var startLeft = rect.left, startTop = rect.top;

        if (!panel.classList.contains('positioned')) {
          panel.style.left = startLeft + 'px';
          panel.style.top = startTop + 'px';
          panel.style.right = 'auto';
          panel.style.bottom = 'auto';
          panel.classList.add('positioned');
        }

        function onMove(ev) {
          if (!isResizing) return;
          var dx = ev.clientX - startX;
          var dy = ev.clientY - startY;
          var nw = startW, nh = startH, nl = startLeft, nt = startTop;

          if (dir.indexOf('w') >= 0) { nw = startW - dx; nl = startLeft + dx; }
          if (dir.indexOf('e') >= 0) { nw = startW + dx; }
          if (dir.indexOf('n') >= 0) { nh = startH - dy; nt = startTop + dy; }
          if (dir.indexOf('s') >= 0) { nh = startH + dy; }

          if (nw < MIN_WIDTH) {
            if (dir.indexOf('w') >= 0) nl -= (MIN_WIDTH - nw);
            nw = MIN_WIDTH;
          }
          if (nh < MIN_HEIGHT) {
            if (dir.indexOf('n') >= 0) nt -= (MIN_HEIGHT - nh);
            nh = MIN_HEIGHT;
          }
          if (nw > window.innerWidth) nw = window.innerWidth;
          if (nh > window.innerHeight) nh = window.innerHeight;
          nl = Math.max(0, Math.min(nl, window.innerWidth - MIN_WIDTH));
          nt = Math.max(0, Math.min(nt, window.innerHeight - 50));

          panel.style.width = nw + 'px';
          panel.style.height = nh + 'px';
          panel.style.left = nl + 'px';
          panel.style.top = nt + 'px';
        }

        function onUp() {
          isResizing = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          var r = panel.getBoundingClientRect();
          localStorage.setItem(SIZE_KEY, JSON.stringify({ w: r.width, h: r.height }));
          localStorage.setItem(POS_KEY, JSON.stringify({ left: r.left, top: r.top }));
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  /* ===== 恢复保存的位置/尺寸 ===== */
  function restoreState() {
    var sizeStr = localStorage.getItem(SIZE_KEY);
    if (sizeStr) {
      try {
        var s = JSON.parse(sizeStr);
        var w = Math.max(MIN_WIDTH, Math.min(s.w, window.innerWidth));
        var h = Math.max(MIN_HEIGHT, Math.min(s.h, window.innerHeight));
        panel.style.width = w + 'px';
        panel.style.height = h + 'px';
      } catch(e) {}
    }
    var posStr = localStorage.getItem(POS_KEY);
    if (posStr) {
      try {
        var p = JSON.parse(posStr);
        var l = Math.max(0, Math.min(p.left, window.innerWidth - MIN_WIDTH));
        var t = Math.max(0, Math.min(p.top, window.innerHeight - 50));
        panel.style.left = l + 'px';
        panel.style.top = t + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.classList.add('positioned');
      } catch(e) {}
    }
  }

  /* ===== 公开接口 ===== */
  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    toggleDock: toggleDock,
    askFromQuiz: askFromQuiz,
    setContext: setContext,
    openSettings: openSettings,
    newChat: newChat
  };
})();
