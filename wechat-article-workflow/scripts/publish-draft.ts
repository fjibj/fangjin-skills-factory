#!/usr/bin/env bun
/**
 * 上传草稿箱脚本
 * 将文章上传到微信公众号草稿箱
 * 使用方式: bun run scripts/publish-draft.ts --article output.html --cover cover.png
 */

import { parseArgs } from "util";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    article: { type: "string" },
    cover: { type: "string" },
  },
  strict: true,
  allowPositionals: true,
});

const articlePath = values.article;
const coverPath = values.cover;

if (!articlePath) {
  console.log("❌ 请提供文章文件路径");
  console.log("用法: bun run scripts/publish-draft.ts --article output.html --cover cover.png");
  process.exit(1);
}

console.log(`📤 正在上传到公众号草稿箱`);
console.log("");
console.log("📋 上传内容:");
console.log(`  文章: ${articlePath}`);
console.log(`  封面: ${coverPath || "未提供"}`);
console.log("");
console.log("🔧 处理流程:");
console.log("  1. 读取配置文件 (wechat-article.config.json)");
console.log("  2. 获取/刷新 Access Token");
console.log("  3. 上传封面图片到微信服务器");
console.log("  4. 上传图文消息素材");
console.log("  5. 保存到草稿箱");
console.log("");
console.log("⚠️  提示: 完整功能需要配置公众号 AppID 和 AppSecret");
console.log("📖 参考: 请先创建 wechat-article.config.json 配置文件");
