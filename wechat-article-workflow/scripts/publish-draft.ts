#!/usr/bin/env bun
/**
 * 上传草稿箱脚本
 * 将文章上传到微信公众号草稿箱
 * 使用方式: bun run scripts/publish-draft.ts --article output.html --cover cover.png
 *
 * 本脚本调用 wechat-article-export skill 进行上传
 */

import { parseArgs } from "util";
import { execSync } from "child_process";

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
console.log(`  文章: ${articlePath}`);
console.log(`  封面: ${coverPath || "未提供"}`);
console.log("");

try {
  // 调用 wechat-article-export skill
  console.log("🚀 调用 wechat-article-export skill...");
  console.log("");

  const coverArg = coverPath ? ` --cover ${coverPath}` : "";
  const result = execSync(`claude skill run wechat-article-export --article ${articlePath}${coverArg}`, {
    encoding: "utf-8",
    stdio: "inherit"
  });

  console.log("");
  console.log("✅ 上传完成！");
} catch (error) {
  console.error("❌ 上传失败");
  console.error("请确保已安装 wechat-article-export skill:");
  console.error("  claude skill install wechat-article-export");
  process.exit(1);
}
