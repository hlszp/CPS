#!/usr/bin/env node
/**
 * Agent 独立运行入口
 *
 * 用法：
 *   node run-agent.js news        # 执行新闻采集（每日）
 *   node run-agent.js literature  # 执行文献采集（每周）
 *   node run-agent.js question    # 执行出题（手动补充，基于全课程）
 *
 * 在 crontab 或 PM2 中配置（也可改用内置 scheduler，无需 crontab）：
 *   0 8 * * * cd /var/www/cps-portal/server && node run-agent.js news
 *   0 9 * * 1 cd /var/www/cps-portal/server && node run-agent.js literature
 */

const newsAgent = require('./agents/news-agent');
const questionAgent = require('./agents/question-agent');

async function main() {
  const agentType = process.argv[2] || 'news';

  console.log(`[AgentRunner] 启动 Agent: ${agentType} (${new Date().toISOString()})`);

  try {
    if (agentType === 'news') {
      const result = await newsAgent.run('cron', 'news');
      console.log(`[AgentRunner] 新闻采集完成: 发现 ${result.itemsFound}, 保存 ${result.itemsSaved}`);
      if (result.errors.length > 0) {
        console.log(`[AgentRunner] 错误: ${result.errors.join('; ')}`);
      }
    } else if (agentType === 'literature') {
      const result = await newsAgent.run('cron', 'literature');
      console.log(`[AgentRunner] 文献采集完成: 发现 ${result.itemsFound}, 保存 ${result.itemsSaved}`);
      if (result.errors.length > 0) {
        console.log(`[AgentRunner] 错误: ${result.errors.join('; ')}`);
      }
    } else if (agentType === 'question') {
      const result = await questionAgent.run({ count: 8, mode: 'course' }, 'cron');
      console.log(`[AgentRunner] 出题完成: 生成 ${result.generated}, 保存 ${result.saved}`);
    } else {
      console.error(`[AgentRunner] 未知 Agent 类型: ${agentType}`);
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error(`[AgentRunner] 执行失败:`, e.message);
    process.exit(1);
  }
}

main();
