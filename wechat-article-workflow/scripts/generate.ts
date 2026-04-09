#!/usr/bin/env bun
/**
 * 微信公众号文章生成入口
 * 使用方式: bun run scripts/generate.ts "文章主题"
 *
 * 本脚本调用 wechat-article-generate skill 进行文章生成
 */

import { execSync } from "child_process";

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

try {
  // 调用 wechat-article-generate skill
  console.log("🚀 调用 wechat-article-generate skill...");
  console.log("");

  const result = execSync(`claude skill run wechat-article-generate "${topic}"`, {
    encoding: "utf-8",
    stdio: "inherit"
  });

  console.log("");
  console.log("✅ 文章生成完成！");
} catch (error) {
  console.error("❌ 文章生成失败");
  console.error("请确保已安装 wechat-article-generate skill:");
  console.error("  claude skill install wechat-article-generate");
  process.exit(1);
}
