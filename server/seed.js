/**
 * 数据迁移脚本 - 将现有静态 JS 数据导入 SQLite 数据库
 * 运行: node seed.js
 */
const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = path.join(__dirname, '..', 'js', 'data');

/**
 * 从 JS 文件中提取导出的变量
 */
function loadJS(filePath, varName) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const fn = new Function(code + `; return ${varName};`);
  return fn();
}

console.log('开始数据迁移...\n');

// ================================================================
// 1. 迁移课程数据
// ================================================================
console.log('[1/5] 迁移课程数据...');

const theoryCourses = loadJS(path.join(DATA_DIR, 'theory.js'), 'THEORY_COURSES');
const practiceCourses = loadJS(path.join(DATA_DIR, 'practice.js'), 'PRACTICE_COURSES');

const courseStmt = db.prepare(`
  INSERT OR REPLACE INTO courses (id, type, title, tag, color, icon, description, content, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let courseOrder = 0;
theoryCourses.forEach(c => {
  courseStmt.run(c.id, 'theory', c.title, c.tag, c.color, c.icon, c.desc, JSON.stringify(c.chapters), courseOrder++);
});
practiceCourses.forEach(c => {
  courseStmt.run(c.id, 'practice', c.title, c.tag, c.color, c.icon, c.desc, JSON.stringify(c.chapters), courseOrder++);
});
console.log(`  ✓ 理论课 ${theoryCourses.length} 门, 实务课 ${practiceCourses.length} 门`);

// ================================================================
// 2. 迁移题库数据
// ================================================================
console.log('[2/5] 迁移题库数据...');

const questionBank = loadJS(path.join(DATA_DIR, 'questions.js'), 'QUESTION_BANK');

const qStmt = db.prepare(`
  INSERT OR REPLACE INTO questions (id, category, question, options, answer, explanation, source, difficulty, weight)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let qCount = 0;
const categories = ['theory_single', 'theory_multiple', 'theory_judge', 'practice_single', 'practice_multiple', 'practice_case'];
categories.forEach(cat => {
  const items = questionBank[cat] || [];
  items.forEach(q => {
    qStmt.run(q.id, cat, q.q, JSON.stringify(q.options || []), q.answer,
      q.exp || null, q.src || null, q.diff || null, q.weight || 1);
    qCount++;
  });
});
console.log(`  ✓ 题库 ${qCount} 道题 (${categories.length} 个分类)`);

// ================================================================
// 3. 迁移练习卡数据
// ================================================================
console.log('[3/5] 迁移练习卡数据...');

const practiceCards = loadJS(path.join(DATA_DIR, 'practice-cards.js'), 'PRACTICE_CARDS');

const topicStmt = db.prepare(`
  INSERT OR REPLACE INTO practice_topics (id, course_id, course_title, course_tag, course_color, topic_title, chapter, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const pqStmt = db.prepare(`
  INSERT INTO practice_questions (topic_id, type, question, options, answer, explanation, source, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 先清空旧练习题
db.prepare('DELETE FROM practice_questions').run();

let topicCount = 0;
let pqCount = 0;
practiceCards.forEach(course => {
  course.topics.forEach((topic, tIdx) => {
    topicStmt.run(topic.topicId, course.courseId, course.courseTitle,
      course.courseTag, course.courseColor, topic.topicTitle, topic.chapter, tIdx);
    topicCount++;

    topic.questions.forEach((q, qIdx) => {
      pqStmt.run(topic.topicId, q.type, q.q, JSON.stringify(q.options || []),
        String(q.answer), q.exp || null, q.src || null, qIdx);
      pqCount++;
    });
  });
});
console.log(`  ✓ 练习主题 ${topicCount} 个, 题目 ${pqCount} 道`);

// ================================================================
// 4. 迁移知识图谱数据
// ================================================================
console.log('[4/5] 迁移知识图谱数据...');

const kg = loadJS(path.join(DATA_DIR, 'knowledge-graph.js'), 'KNOWLEDGE_GRAPH');

db.prepare('INSERT OR REPLACE INTO knowledge_graph (id, data) VALUES (1, ?)').run(JSON.stringify(kg));
console.log(`  ✓ 节点 ${(kg.nodes || []).length} 个, 边 ${(kg.edges || []).length} 条`);

// ================================================================
// 5. 创建默认管理员
// ================================================================
console.log('[5/5] 创建默认管理员...');

const bcrypt = require('bcryptjs');
const existingAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@cps.edu'").get();
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (?, ?, ?, 'admin')
  `).run('admin@cps.edu', hash, '管理员');
  console.log('  ✓ 默认管理员: admin@cps.edu / admin123');
} else {
  console.log('  - 管理员已存在，跳过');
}

// ================================================================
// 完成
// ================================================================
console.log('\n========================================');
console.log('  数据迁移完成！');
console.log(`  课程: ${theoryCourses.length + practiceCourses.length} 门`);
console.log(`  题库: ${qCount} 道`);
console.log(`  练习卡: ${topicCount} 主题, ${pqCount} 题`);
console.log(`  知识图谱: ${(kg.nodes || []).length} 节点, ${(kg.edges || []).length} 边`);
console.log('========================================');
console.log('\n默认管理员账号:');
console.log('  邮箱: admin@cps.edu');
console.log('  密码: admin123');
console.log('\n请启动服务器: npm start');
