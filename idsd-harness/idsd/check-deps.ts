#!/usr/bin/env tsx
/**
 * IDSD 切片依赖检查器 — 上游切片升版本，自动标出下游要重审的切片。
 *
 * 原理（把 Cordis 的 reactive coeffect 最小化到 IDSD）：
 *   每个切片声明 depends_on（建立在上游哪个锚点版本之上）+ provides（对外提供哪个版本）。
 *   比对：上游当前版本 ≠ 下游声明依赖的版本 → 标 stale。
 *
 * 用法：
 *   npx tsx idsd/check-deps.ts [dependencies.json 路径]
 *   默认读 ./idsd/dependencies.json
 *
 * 三态（优先级 blocked > stale > ready）：
 *   ready    依赖的上游已就绪且版本一致
 *   stale    依赖的上游版本变了，本切片要重审
 *   blocked  依赖的上游还没建好（不在清单 / 未声明 provides / 缺该锚点）
 *
 * 退出码：0 = 全部 ready；1 = 存在 stale 或 blocked；2 = 文件缺失 / JSON 解析失败
 *
 * v1 边界：只标「要重审」，不自动重跑评估、不改文件；多层传播靠「处理完一层再跑一次」。
 */

import fs from 'fs';
import path from 'path';

type Status = 'ready' | 'stale' | 'blocked';
const RANK: Record<Status, number> = { ready: 0, stale: 1, blocked: 2 };

interface DepEntry {
  slice: string;
  [anchor: string]: string;
}
interface SliceEntry {
  provides?: Record<string, string>;
  depends_on?: DepEntry[];
}
interface DepsFile {
  _comment?: string;
  slices: Record<string, SliceEntry>;
}

function main(): void {
  const depPath = process.argv[2] || path.join('idsd', 'dependencies.json');

  if (!fs.existsSync(depPath)) {
    console.error(`✗ 找不到依赖清单：${depPath}\n  先创建 idsd/dependencies.json（参考 idsd-harness 模板）。`);
    process.exit(2);
  }

  let data: DepsFile;
  try {
    data = JSON.parse(fs.readFileSync(depPath, 'utf8'));
  } catch (e) {
    console.error(`✗ ${depPath} 不是合法 JSON：${(e as Error).message}`);
    process.exit(2);
  }

  const slices = data.slices;
  if (!slices || Object.keys(slices).length === 0) {
    console.log('（slices 为空，暂无依赖可查）');
    process.exit(0);
  }

  let hasProblem = false;

  for (const [name, entry] of Object.entries(slices)) {
    const deps = entry.depends_on || [];
    if (deps.length === 0) {
      console.log(`✓ ready       ${name}（无上游依赖）`);
      continue;
    }

    let status: Status = 'ready';
    const reasons: string[] = [];

    for (const dep of deps) {
      const upstream = slices[dep.slice];
      const anchors = Object.entries(dep).filter(([k]) => k !== 'slice');

      if (!upstream) {
        if (RANK[status] < RANK.blocked) status = 'blocked';
        reasons.push(`上游 ${dep.slice} 不在清单里`);
        continue;
      }

      for (const [anchor, expected] of anchors) {
        const actual = upstream.provides?.[anchor];
        if (actual === undefined) {
          if (RANK[status] < RANK.blocked) status = 'blocked';
          reasons.push(`${dep.slice} 未声明 provides.${anchor}`);
        } else if (actual !== expected) {
          if (RANK[status] < RANK.stale) status = 'stale';
          reasons.push(`${dep.slice}.${anchor} 现为 @${actual}（本切片建在 @${expected}）`);
        }
      }
    }

    if (status === 'ready') {
      console.log(`✓ ready       ${name}`);
    } else {
      hasProblem = true;
      const tag = status === 'stale' ? '✗ stale' : '⏳ blocked';
      console.log(`${tag}    ${name}  —  ${reasons.join('；')}`);
    }
  }

  const n = Object.keys(slices).length;
  console.log(`\n${n} 个切片已检查，${hasProblem ? '存在需要处理的依赖' : '全部就绪'}。`);
  if (hasProblem) process.exit(1);
}

main();
