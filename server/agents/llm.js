/**
 * LLM API 客户端 - 兼容 DeepSeek / OpenAI / Qwen 等接口
 * 统一封装 chat completion 调用
 */

const DEFAULT_API_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';

/**
 * 读取配置（从环境变量或 config 文件）
 */
function getConfig() {
  // 优先从环境变量读取
  if (process.env.LLM_API_KEY) {
    return {
      apiKey: process.env.LLM_API_KEY,
      apiUrl: process.env.LLM_API_URL || DEFAULT_API_URL,
      model: process.env.LLM_MODEL || DEFAULT_MODEL
    };
  }

  // 从 config 文件读取（不纳入版本控制）
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, '..', 'data', 'agent-config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error('[LLM] 配置文件解析失败:', e.message);
    }
  }

  return null;
}

/**
 * 保存配置
 */
function saveConfig(config) {
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, '..', 'data', 'agent-config.json');
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return true;
}

/**
 * 获取配置（脱敏，用于 API 返回）
 */
function getSafeConfig() {
  const config = getConfig();
  if (!config) return { configured: false };
  return {
    configured: true,
    apiUrl: config.apiUrl,
    model: config.model,
    apiKeyMasked: config.apiKey ? config.apiKey.slice(0, 6) + '****' + config.apiKey.slice(-4) : ''
  };
}

/**
 * 调用 LLM Chat Completion
 * @param {Array} messages - [{role, content}]
 * @param {Object} options - { temperature, max_tokens, response_format }
 * @returns {string} - LLM 返回的文本内容
 */
async function chat(messages, options = {}) {
  const config = options.config || getConfig();
  if (!config || !config.apiKey) {
    throw new Error('LLM API 未配置，请在智能体页面配置 API Key');
  }

  const apiUrl = config.apiUrl || DEFAULT_API_URL;
  const url = apiUrl.replace(/\/$/, '') + '/chat/completions';

  const body = {
    model: config.model || DEFAULT_MODEL,
    messages: messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens || 2000
  };

  // DeepSeek / OpenAI 支持 JSON 模式
  if (options.json) {
    body.response_format = { type: 'json_object' };
  }

  // 超时控制（默认 30 秒）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify(body),
      signal: options.signal || controller.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `LLM API 错误 (${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg += ': ' + errJson.error.message;
        else errMsg += ': ' + errText.slice(0, 200);
      } catch {
        errMsg += ': ' + errText.slice(0, 200);
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 调用 LLM 并解析 JSON 输出
 */
async function chatJSON(messages, options = {}) {
  const text = await chat(messages, { ...options, json: true });
  try {
    return JSON.parse(text);
  } catch (e) {
    // 尝试从文本中提取 JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) {}
    }
    throw new Error('LLM 返回内容无法解析为 JSON: ' + text.slice(0, 200));
  }
}

module.exports = { chat, chatJSON, getConfig, saveConfig, getSafeConfig };
