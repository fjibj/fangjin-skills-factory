#!/usr/bin/env tsx
/**
 * IDSD Holdout Set Evaluator v2 — scenario → API assertion automation.
 *
 * 从 agent-chat-box 域层实战（2026-08，5 切片 12 轮评估，153/153 场景闭环）验证过的
 * evaluate.ts 移植通用化而来。实战证明：**判分自动化是 IDSD 能否规模化的命门**——
 * 场景必须可执行、判分必须独立，否则盲考闭环跑不起来。
 *
 * 本文件是「参考实现」：Fastify + TypeScript 项目可直接使用；
 * 其他技术栈请保留断言 DSL 与匹配器，按【适配区】注释改 buildApp() 与基线命令。
 *
 * 用法：
 *   npx tsx evaluate.ts <version_tag> [--skip-baseline]
 *   例：npx tsx evaluate.ts slice1-v1
 *
 * 场景文件格式（scenarios/{success,failure,boundary}/*.md）：
 *   ---
 *   { "checks": [ ... ] }
 *   ---
 *   # 人类语言场景描述……
 *   checks 缺失或为空 → 该场景标记 MANUAL（人工验收），不参与通过率。
 *
 * check 结构：
 *   {
 *     "name": "创建群",                      // 可选，默认 "METHOD url"
 *     "method": "POST",                     // 默认 GET
 *     "url": "/api/groups",                 // 支持 {{var}} 替换
 *     "body": { ... },                      // 支持 {{var}} 替换
 *     "expect": {
 *       "status": 201,                      // 期望 HTTP 状态码（先查实现惯例，别臆测！）
 *       "json": { ... }                     // 响应体部分匹配（见下）
 *     },
 *     "capture": { "groupId": "id", "channelId": "channel_id" }  // 匹配通过后按点路径捕获变量
 *   }
 *
 * json 匹配器（部分匹配：只检查列出的字段）：
 *   字面值          → 严格相等
 *   数组字面值      → 深比较
 *   {"$exists":b}   → 键存在性
 *   {"$eq":v}       → 深相等（v 支持 {{var}}）
 *   {"$ne":v}       → 不相等
 *   {"$gt":n} {"$gte":n} {"$lt":n} {"$lte":n} → 数值比较
 *   {"$startsWith":s} {"$endsWith":s} {"$contains":s} → 字符串（$contains 不支持数组！数组用 $any）
 *   {"$matches":r}  → 正则（new RegExp(r)）
 *   {"$length":n}   → 数组长度
 *   {"$any":m}      → 数组中至少一项匹配 m
 *   {"$all":m}      → 数组中所有项匹配 m
 *   {"$none":m}     → 数组中无一项匹配 m
 *
 * 每个场景使用独立的全新数据库（场景之间零污染），结果写入 results/<version>.json。
 * 每次评估用一个新 version_tag（slice1-v1/v2/...），失败轮次也存档——它是
 * 「考题问题 vs 实现缺陷」判别的证据链。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 【适配区】按你的项目修改
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, '..'); // holdout/ 的上级目录
const holdoutDir = __dirname;
const resultsDir = path.join(holdoutDir, 'results');
const SCENARIO_CATEGORIES = ['success', 'failure', 'boundary'];

// 基线门禁命令（在 PROJECT_ROOT 下执行；从 runner-config.json 读取，缺省回退 npm）
function loadBaselineCommands(): Array<[string, string]> {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(holdoutDir, 'runner-config.json'), 'utf-8'));
    const cmds: Array<[string, string]> = [];
    if (cfg.test_command) cmds.push(['test', cfg.test_command]);
    if (cfg.typecheck_command) cmds.push(['typecheck', cfg.typecheck_command]);
    if (cmds.length > 0) return cmds;
  } catch {
    /* 回退默认 */
  }
  return [
    ['test', 'npm test'],
    ['typecheck', 'npm run typecheck'],
  ];
}
const BASELINE_COMMANDS = loadBaselineCommands();

/**
 * 构建被测应用（返回 Fastify 实例即可，runCheck 用 app.inject 进程内执行 HTTP，
 * 不起服务不占端口）。
 *
 * agent-chat-box 参考实现（迁移自实战 evaluate.ts）：
 *   1. 动态导入 server 模块：await import('../../packages/server/src/db/index.js')
 *      （注意：导入前要设置 process.env.DATA_DIR，模块加载时读取）
 *   2. 创建 Fastify 实例并注册项目需要的插件（CORS/multipart 等）
 *   3. 注册路由：扫描 api/ 目录下所有 register*Routes 模块自动注册
 *      ——新切片新增 API 后评估器零改动
 *   4. 非 Fastify 项目：起真实服务后把 runCheck 里的 app.inject 换成 HTTP 调用即可
 */
async function buildApp(): Promise<any> {
  const Fastify = (await import('fastify')).default;

  // --- 你的项目：初始化数据库（如有）并构建 app ---
  // 例（agent-chat-box）：
  //   process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'idsd-holdout-'));
  //   const dbMod = await import('../../packages/server/src/db/index.js');
  //   await dbMod.createDatabase();

  const app = Fastify({ logger: false });

  // --- 你的项目：注册路由 ---
  // 例（agent-chat-box 自动发现 api/ 下所有 register*Routes）：
  //   const apiDir = path.resolve(PROJECT_ROOT, 'packages', 'server', 'src', 'api');
  //   for (const f of fs.readdirSync(apiDir).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts'))) {
  //     const mod = await import(`.../${f.replace(/\.ts$/, '.js')}`);
  //     const fn = Object.keys(mod).find((k) => k.startsWith('register') && k.endsWith('Routes') && typeof mod[k] === 'function');
  //     if (fn) await mod[fn](app);
  //   }

  return app;
}

/** 每个场景开始前重置数据库（返回后场景从零状态开始） */
async function resetDatabase(): Promise<void> {
  // 例（agent-chat-box）：
  //   const dbMod = await import('.../db/index.js');
  //   dbMod.resetDatabase?.();
  //   const dbFile = path.join(process.env.DATA_DIR!, 'chatbox.sqlite');
  //   if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  //   await dbMod.createDatabase();
}

/** 评估结束后清理临时数据 */
async function cleanupDatabase(): Promise<void> {
  // 例：fs.rmSync(process.env.DATA_DIR!, { recursive: true, force: true });
}

// ============================================================
// 场景加载
// ============================================================

function parseScenario(file: string) {
  const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
  const name = path.basename(file, '.md');
  const category = path.basename(path.dirname(file));
  let checks: Array<Record<string, any>> | null = null;
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    try {
      const parsed = JSON.parse(fm[1]);
      checks = Array.isArray(parsed.checks) ? parsed.checks : null;
    } catch {
      checks = null;
    }
  }
  return { name, category, checks, description: raw };
}

function loadScenarios() {
  const scenarios: Array<ReturnType<typeof parseScenario>> = [];
  for (const category of SCENARIO_CATEGORIES) {
    const dir = path.join(holdoutDir, 'scenarios', category);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      scenarios.push(parseScenario(path.join(dir, f)));
    }
  }
  return scenarios;
}

// ============================================================
// 模板替换与匹配器
// ============================================================

function substitute(value: any, ctx: Record<string, any>): any {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      k in ctx ? String(ctx[k]) : `{{${k}}}`,
    );
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, ctx));
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = substitute(v, ctx);
    return out;
  }
  return value;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function matchValue(actual: any, expected: any, ctx: Record<string, any>): boolean {
  if (expected === null) return actual === null;
  if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
    const keys = Object.keys(expected);
    if (keys.length === 1 && keys[0].startsWith('$')) {
      return matchOp(actual, expected, keys[0], ctx);
    }
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) return false;
    return keys.every((k) => k in actual && matchValue(actual[k], expected[k], ctx));
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    return (
      expected.length === actual.length &&
      expected.every((e, i) => matchValue(actual[i], e, ctx))
    );
  }
  return actual === substitute(expected, ctx);
}

function matchOp(actual: any, spec: Record<string, any>, op: string, ctx: Record<string, any>): boolean {
  const arg = spec[op];
  switch (op) {
    case '$exists':
      return arg ? actual !== undefined && actual !== null : actual === undefined || actual === null;
    case '$eq':
      return deepEqual(actual, substitute(arg, ctx));
    case '$ne':
      return !deepEqual(actual, substitute(arg, ctx));
    case '$gt':
      return typeof actual === 'number' && actual > arg;
    case '$gte':
      return typeof actual === 'number' && actual >= arg;
    case '$lt':
      return typeof actual === 'number' && actual < arg;
    case '$lte':
      return typeof actual === 'number' && actual <= arg;
    case '$startsWith':
      return typeof actual === 'string' && actual.startsWith(arg);
    case '$endsWith':
      return typeof actual === 'string' && actual.endsWith(arg);
    case '$contains':
      return typeof actual === 'string' && actual.includes(arg);
    case '$matches':
      return typeof actual === 'string' && new RegExp(arg).test(actual);
    case '$length':
      return Array.isArray(actual) && actual.length === arg;
    case '$any':
      return Array.isArray(actual) && actual.some((item) => matchValue(item, arg, ctx));
    case '$all':
      return Array.isArray(actual) && actual.length > 0 && actual.every((item) => matchValue(item, arg, ctx));
    case '$none':
      return Array.isArray(actual) && !actual.some((item) => matchValue(item, arg, ctx));
    default:
      return false;
  }
}

function getPath(obj: any, dotPath: string): any {
  return dotPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

// ============================================================
// 检查执行
// ============================================================

async function runCheck(app: any, check: Record<string, any>, ctx: Record<string, any>) {
  const method = String(check.method || 'GET').toUpperCase();
  const url = substitute(check.url, ctx);
  const body = check.body ? substitute(check.body, ctx) : undefined;
  const name = check.name || `${method} ${url}`;

  const res = await app.inject({ method, url, payload: body });
  let bodyObj: any = null;
  try {
    bodyObj = res.json();
  } catch {
    bodyObj = null;
  }

  const expect = check.expect || {};
  if (expect.status !== undefined && res.statusCode !== expect.status) {
    return {
      name,
      pass: false,
      detail: `status: expected ${expect.status}, got ${res.statusCode}; body=${JSON.stringify(bodyObj)}`,
    };
  }
  if (expect.json !== undefined && !matchValue(bodyObj, expect.json, ctx)) {
    return {
      name,
      pass: false,
      detail: `json mismatch; expected=${JSON.stringify(expect.json)} actual=${JSON.stringify(bodyObj)}`,
    };
  }
  if (check.capture) {
    for (const [varName, dotPath] of Object.entries(check.capture)) {
      ctx[varName] = getPath(bodyObj, String(dotPath));
    }
  }
  return { name, pass: true, detail: `${method} ${url} → ${res.statusCode}` };
}

// ============================================================
// 基线门禁
// ============================================================

function runBaseline(): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  for (const [label, cmd] of BASELINE_COMMANDS) {
    if (!cmd) {
      results[label] = true;
      continue;
    }
    try {
      execSync(cmd, { cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'], timeout: 600_000 });
      results[label] = true;
    } catch (err: any) {
      results[label] = false;
      if (err.stdout) process.stdout.write(String(err.stdout).slice(-1500));
      if (err.stderr) process.stderr.write(String(err.stderr).slice(-1500));
    }
  }
  return results;
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const version = args[0];
  if (!version) {
    console.log('Usage: npx tsx evaluate.ts <version_tag> [--skip-baseline]');
    process.exit(1);
  }
  const skipBaseline = args.includes('--skip-baseline');

  console.log('='.repeat(56));
  console.log('IDSD Holdout Set Evaluation v2');
  console.log(`Version: ${version}`);
  console.log('='.repeat(56));

  let baseline: Record<string, boolean> | null = null;
  if (!skipBaseline) {
    console.log('\n[1/3] Baseline gate…');
    baseline = runBaseline();
    for (const [label, ok] of Object.entries(baseline)) {
      console.log(`  ${label}: ${ok ? 'PASS ✅' : 'FAIL ❌'}`);
    }
    if (Object.values(baseline).some((v) => !v)) {
      console.log('\nBaseline gate failed — 先修基线，再评估场景。');
    }
  }

  console.log('\n[2/3] Building app + evaluating scenarios…');
  await resetDatabase();
  const app = await buildApp();

  const scenarios = loadScenarios();
  const results: Record<string, any> = {
    version,
    total: 0,
    passed: 0,
    failed: 0,
    manual: 0,
    baseline,
    scenarios: [],
    timestamp: Math.floor(Date.now() / 1000),
  };

  for (const scenario of scenarios) {
    const ctx: Record<string, any> = {};
    await resetDatabase();

    console.log(`\n  Scenario: ${scenario.name} (${scenario.category})`);
    if (!scenario.checks || scenario.checks.length === 0) {
      results.manual += 1;
      results.total += 1;
      results.scenarios.push({ name: scenario.name, category: scenario.category, status: 'MANUAL', checks: [] });
      console.log('    (no checks — MANUAL verification required)');
      continue;
    }

    const checkResults: Array<Record<string, any>> = [];
    for (const check of scenario.checks) {
      const r = await runCheck(app, check, ctx);
      checkResults.push(r);
      console.log(`    ${r.pass ? '✅' : '❌'} ${r.name} — ${r.detail}`);
      if (!r.pass) break;
    }
    const status = checkResults.every((r) => r.pass) ? 'PASS' : 'FAIL';
    results.total += 1;
    if (status === 'PASS') results.passed += 1;
    else results.failed += 1;
    results.scenarios.push({ name: scenario.name, category: scenario.category, status, checks: checkResults });
  }

  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `${version}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

  await cleanupDatabase();

  console.log('\n' + '='.repeat(56));
  console.log(`Results saved: ${outFile}`);
  console.log('='.repeat(56));
  console.log(`Total scenarios: ${results.total}`);
  console.log(`Passed:          ${results.passed} ✅`);
  console.log(`Failed:          ${results.failed} ❌`);
  console.log(`Manual:          ${results.manual} ⏭️`);
  if (results.total - results.manual > 0) {
    const rate = (results.passed / (results.total - results.manual)) * 100;
    console.log(`Pass rate:       ${rate.toFixed(1)}%`);
  }
  console.log('='.repeat(56));

  const baselineOk = baseline === null || Object.values(baseline).every((v) => v);
  if (results.failed > 0 || !baselineOk) process.exit(1);
}

main().catch((err) => {
  console.error('[evaluate] Fatal:', err);
  process.exit(1);
});
