#!/usr/bin/env bun
/**
 * 风格学习脚本
 * 分析参考文章，提取写作风格 DNA
 * 使用方式: bun run scripts/learn-style.ts [参考文章URL]
 *
 * 本脚本调用 wechat-article-maydayv skill 进行风格学习
 */

import { execSync } from "child_process";

const url = process.argv[2];

if (!url) {
  console.log("❌ 请提供参考文章 URL");
  console.log("用法: bun run scripts/learn-style.ts [参考文章URL]");
  process.exit(1);
}

console.log(`🎨 正在分析文章风格: ${url}`);
console.log("");

try {
  // 调用 wechat-article-maydayv skill
  console.log("🚀 调用 wechat-article-maydayv skill...");
  console.log("");

  const result = execSync(`claude skill run wechat-article-maydayv "${url}"`, {
    encoding: "utf-8",
    stdio: "inherit"
  });

  console.log("");
  console.log("✅ 风格学习完成！");
} catch (error) {
  console.error("❌ 风格学习失败");
  console.error("请确保已安装 wechat-article-maydayv skill:");
  console.error("  claude skill install wechat-article-maydayv");
  process.exit(1);
}
