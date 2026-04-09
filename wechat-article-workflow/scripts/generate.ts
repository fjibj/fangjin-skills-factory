#!/usr/bin/env bun
/**
 * 微信公众号文章生成入口
 * 使用方式: bun run scripts/generate.ts "文章主题"
 */

const topic = process.argv[2] || "AI技术趋势";

console.log(`📝 开始创作文章: ${topic}`);
console.log("");
console.log("📋 工作流程:");
console.log("  1️⃣ 时事研究员 - 收集素材");
console.log("  2️⃣ 深度思考者 - 撰写草稿");
console.log("  3️⃣ Meme大师 - 注入网感");
console.log("  4️⃣ 铁面主编 - 融合定稿");
console.log("  5️⃣ 中控裁判 - 质量评分");
console.log("  6️⃣ 文章渲染器 - HTML输出");
console.log("");
console.log("⚠️  提示: 完整功能开发中，请使用 SKILL.md 中的详细文档");
console.log("📖 参考: ~/.claude/skills/wechat-article-workflow/SKILL.md");
