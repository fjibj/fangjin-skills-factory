#!/usr/bin/env tsx
/**
 * IDSD Holdout Set Evaluator v3 — scenario + property → 自动判分。
 *
 * 从 agent-chat-box 域层实战（2026-08，5 切片 12 轮评估，153/153 场景闭环）验证过的
 * evaluate.ts 移植通用化而来。实战证明：**判分自动化是 IDSD 能否规模化的命门**——
 * 场景必须可执行、判分必须独立，否则盲考闭环跑不起来。
 *
 * v3 新增（2026-11-20）：
 *   - --observe   观察模式：新场景首轮只记「本会失败」，不阻断（对治出题误报）
 *   - properties/ 属性测试：生成器造输入 + 不变式断言，补 E2E 抓不到的语义缺陷
 *   - --affected  按 git diff 触发：只跑命中的不变式场景，替代全量回归
 *   - --stamp     验证戳：产出可写进 commit message 的 Verified-by 行
 *
 * 本文件是「参考实现」：Fastify + TypeScript 项目可直接使用；
 * 其他技术栈请保留断言 DSL 与匹配器，按【适配区】注释改 buildApp() 与基线命令。
 *
 * 用法：
 *   npx tsx evaluate.ts <version_tag> [options]
 *
 *   --skip-baseline        跳过基线门禁（快速迭代）
 *   --observe              观察模式：只记录，不判死（结果写 <version>.observe.json）
 *   --affected[=BASE]      只跑 git diff 命中的不变式（BASE 默认 HEAD，比较工作区）
 *   --slice=NAME           只跑场景文件名以 NAME 开头的（本切片全量）
 *   --stamp                通过后产出 Verification stamp（写 <version>.stamp.txt）
 *   --properties-only      只跑 property 测试（跳过 scenarios）
 *   --no-properties        只跑 scenarios（跳过 property）
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
 * property 文件格式（properties/*.json）：
 *   {
 *     "id": "PROP-01",
 *     "name": "域隔离不变式",
 *     "invariant": "域 A 的写操作不得改变域 B 的聚合结果",
 *     "runs": 30,
 *     "variables": {
 *       "domainA": { "type": "pick",   "values": ["dA1", "dA2"] },
 *       "group":   { "type": "string", "prefix": "g-", "len": [3, 6] },
 *       "score":   { "type": "int",    "min": 1, "max": 5 }
 *     },
 *     "steps":  [ ...check 数组，可用 {{var}}... ],   // 每次迭代先造数据
 *     "assert": [ ...check 数组... ]                  // 不变式断言
 *   }
 *   变量类型：int / float / pick / string / bool
 *   种子确定性：seed = fnv1a("<version>:<propId>:<i>")，任意失败可精确复现；
 *   shrink：失败后把变量收敛到最小候选值并重跑，直到不能再简化（产出最小反例）。
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
const PROPERTY_DIR = path.join(holdoutDir, 'properties');
const invariantsFile = path.join(PROJECT_ROOT, 'idsd', 'invariants.json');

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
// CLI 参数
// ============================================================

interface Options {
  version: string;
  skipBaseline: boolean;
  observe: boolean;
  affected: string | null; // null = 未启用；字符串 = git 比较基准
  slice: string | null;
  stamp: boolean;
  runScenarios: boolean;
  runProperties: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    version: '',
    skipBaseline: false,
    observe: false,
    affected: null,
    slice: null,
    stamp: false,
    runScenarios: true,
    runProperties: true,
  };
  for (const a of argv) {
    if (a === '--skip-baseline') opts.skipBaseline = true;
    else if (a === '--observe') opts.observe = true;
    else if (a === '--stamp') opts.stamp = true;
    else if (a === '--properties-only') opts.runScenarios = false;
    else if (a === '--no-properties') opts.runProperties = false;
    else if (a === '--affected') opts.affected = 'HEAD';
    else if (a.startsWith('--affected=')) opts.affected = a.slice('--affected='.length) || 'HEAD';
    else if (a.startsWith('--slice=')) opts.slice = a.slice('--slice='.length);
    else if (!a.startsWith('--') && !opts.version) opts.version = a;
  }
  return opts;
}

// ============================================================
// 确定性随机（可复算的基石：同一 version + prop + 序号 → 同一输入）
// ============================================================

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

function loadScenarios(filter?: { slice?: string | null; names?: Set<string> | null }) {
  const scenarios: Array<ReturnType<typeof parseScenario> & { file: string }> = [];
  for (const category of SCENARIO_CATEGORIES) {
    const dir = path.join(holdoutDir, 'scenarios', category);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const full = path.join(dir, f);
      const sc = parseScenario(full);
      if (filter?.slice && !sc.name.startsWith(filter.slice)) continue;
      if (filter?.names && !filter.names.has(`${category}/${sc.name}`)) continue;
      scenarios.push({ ...sc, file: full });
    }
  }
  return scenarios;
}

// ============================================================
// 模板替换与匹配器
// ============================================================

function substitute(value: any, ctx: Record<string, any>): any {
  if (typeof value === 'string') {
    // 整体就是一个占位符 → 保留原类型（property 生成器常产出 number/bool，
    // 若强转字符串会让 API 收到 "5" 而非 5）；否则按字符串模板替换
    const only = value.match(/^\{\{(\w+)\}\}$/);
    if (only && only[1] in ctx) return ctx[only[1]];
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

/** 顺序执行一组 check，遇到失败即停（与场景语义一致） */
async function runChecks(
  app: any,
  checks: Array<Record<string, any>>,
  ctx: Record<string, any>,
): Promise<Array<{ name: string; pass: boolean; detail: string }>> {
  const out: Array<{ name: string; pass: boolean; detail: string }> = [];
  for (const check of checks) {
    const r = await runCheck(app, check, ctx);
    out.push(r);
    if (!r.pass) break;
  }
  return out;
}

// ============================================================
// Property 测试：生成器 + 不变式断言 + shrink
// ============================================================

interface VarSpec {
  type: 'int' | 'float' | 'pick' | 'string' | 'bool';
  min?: number;
  max?: number;
  values?: any[];
  prefix?: string;
  len?: [number, number];
  suffix?: string;
}

interface PropertySpec {
  id?: string;
  name: string;
  invariant: string;
  runs?: number;
  variables: Record<string, VarSpec>;
  steps?: Array<Record<string, any>>;
  assert: Array<Record<string, any>>;
  shrink?: boolean;
}

function loadProperties(): Array<PropertySpec & { file: string }> {
  if (!fs.existsSync(PROPERTY_DIR)) return [];
  const out: Array<PropertySpec & { file: string }> = [];
  for (const f of fs.readdirSync(PROPERTY_DIR).filter((x) => x.endsWith('.json')).sort()) {
    const full = path.join(PROPERTY_DIR, f);
    try {
      const spec = JSON.parse(fs.readFileSync(full, 'utf-8'));
      if (!spec || !spec.name || !Array.isArray(spec.assert)) {
        console.log(`  [property] skip ${f}: 缺少 name 或 assert 数组`);
        continue;
      }
      out.push({ ...spec, file: full });
    } catch (e: any) {
      console.log(`  [property] skip ${f}: JSON 解析失败 (${e.message})`);
    }
  }
  return out;
}

/** 按变量声明生成一个取值（rnd 已由确定性种子构造） */
function genValue(spec: VarSpec, rnd: () => number): any {
  switch (spec.type) {
    case 'int': {
      const min = spec.min ?? 0;
      const max = spec.max ?? min + 10;
      return min + Math.floor(rnd() * (max - min + 1));
    }
    case 'float': {
      const min = spec.min ?? 0;
      const max = spec.max ?? min + 1;
      return Math.round((min + rnd() * (max - min)) * 100) / 100;
    }
    case 'pick': {
      const values = spec.values ?? [];
      if (values.length === 0) return null;
      return values[Math.floor(rnd() * values.length)];
    }
    case 'bool':
      return rnd() < 0.5;
    case 'string': {
      const [lo, hi] = spec.len ?? [3, 6];
      const n = lo + Math.floor(rnd() * (hi - lo + 1));
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      let s = '';
      for (let i = 0; i < n; i++) s += alphabet[Math.floor(rnd() * alphabet.length)];
      return `${spec.prefix ?? ''}${s}${spec.suffix ?? ''}`;
    }
    default:
      return null;
  }
}

/** 最小候选值——shrink 的目标（int→min、string→前缀+最短、pick→第一个） */
function minimalValue(spec: VarSpec): any {
  switch (spec.type) {
    case 'int':
      return spec.min ?? 0;
    case 'float':
      return spec.min ?? 0;
    case 'pick':
      return (spec.values ?? [null])[0];
    case 'bool':
      return false;
    case 'string': {
      const [lo] = spec.len ?? [3, 6];
      return `${spec.prefix ?? ''}${'a'.repeat(lo)}${spec.suffix ?? ''}`;
    }
    default:
      return null;
  }
}

/** 跑一次：造数据(steps) → 断言不变式(assert) */
async function runPropertyOnce(
  app: any,
  spec: PropertySpec,
  vars: Record<string, any>,
): Promise<{ ok: boolean; failedAt: string | null; detail: string | null; stepFailures: any[] }> {
  await resetDatabase();
  const ctx: Record<string, any> = { ...vars };

  if (spec.steps && spec.steps.length > 0) {
    const sr = await runChecks(app, spec.steps, ctx);
    const failed = sr.find((r) => !r.pass);
    if (failed) {
      // steps 失败说明前置数据没造出来——这是 property 自身问题，不是不变式违例
      return { ok: false, failedAt: `steps: ${failed.name}`, detail: failed.detail, stepFailures: sr };
    }
  }

  const ar = await runChecks(app, spec.assert, ctx);
  const failed = ar.find((r) => !r.pass);
  if (failed) {
    return { ok: false, failedAt: failed.name, detail: failed.detail, stepFailures: [] };
  }
  return { ok: true, failedAt: null, detail: null, stepFailures: [] };
}

/** shrink：逐个变量换成最小候选值，仍失败即采纳；迭代到不再简化 */
async function shrinkFailure(
  app: any,
  spec: PropertySpec,
  vars: Record<string, any>,
): Promise<{ vars: Record<string, any>; removed: string[]; detail: string | null; failedAt: string | null }> {
  let current = { ...vars };
  const removed: string[] = [];
  const last = await runPropertyOnce(app, spec, current);
  let detail = last.detail;
  let failedAt = last.failedAt;

  for (let round = 0; round < 3; round++) {
    let changed = false;
    for (const key of Object.keys(spec.variables)) {
      const minimal = minimalValue(spec.variables[key]);
      if (deepEqual(current[key], minimal)) continue;
      const trial = { ...current, [key]: minimal };
      const r = await runPropertyOnce(app, spec, trial);
      if (!r.ok) {
        current = trial;
        detail = r.detail;
        failedAt = r.failedAt;
        if (!removed.includes(key)) removed.push(key);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { vars: current, removed, detail, failedAt };
}

/** 跑一个 property：runs 次确定性迭代，首次失败即 shrink 并返回 */
async function runProperty(app: any, spec: PropertySpec, version: string) {
  const runs = spec.runs ?? 20;
  const seedBase = spec.seed ?? '';
  let passedRuns = 0;
  const started = Date.now();

  for (let i = 0; i < runs; i++) {
    const rnd = mulberry32(fnv1a(`${version}:${seedBase}:${spec.name}:${i}`));
    const vars: Record<string, any> = {};
    for (const [key, vs] of Object.entries(spec.variables || {})) {
      vars[key] = genValue(vs, rnd);
    }

    const r = await runPropertyOnce(app, spec, vars);
    if (r.ok) {
      passedRuns += 1;
      continue;
    }

    // 失败 → shrink 出最小反例
    let counterexample = vars;
    let shrunk: string[] = [];
    let detail = r.detail;
    let failedAt = r.failedAt;
    if (spec.shrink !== false) {
      const s = await shrinkFailure(app, spec, vars);
      counterexample = s.vars;
      shrunk = s.removed;
      detail = s.detail;
      failedAt = s.failedAt;
    }

    return {
      id: spec.id ?? spec.name,
      name: spec.name,
      invariant: spec.invariant,
      runs,
      passed_runs: passedRuns,
      failed_at_run: i,
      seed: `${version}:${seedBase}:${spec.name}:${i}`,
      status: 'FAIL',
      failed_check: failedAt,
      detail,
      counterexample,
      shrunk_variables: shrunk,
      judge_issue: r.stepFailures.length > 0, // steps 挂了 = 可能是出题问题
      elapsed_ms: Date.now() - started,
    };
  }

  return {
    id: spec.id ?? spec.name,
    name: spec.name,
    invariant: spec.invariant,
    runs,
    passed_runs: passedRuns,
    failed_at_run: null,
    seed: null,
    status: 'PASS',
    failed_check: null,
    detail: null,
    counterexample: null,
    shrunk_variables: [],
    judge_issue: false,
    elapsed_ms: Date.now() - started,
  };
}

// ============================================================
// --affected：按 git diff 命中 invariants.json
// ============================================================

interface Invariant {
  id: string;
  desc: string;
  trigger?: string[];
  scenarios?: string[];
  property?: string;
}

function globToRegex(glob: string): RegExp {
  let re = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i += 2;
        if (glob[i] === '/') {
          re += '(?:.*/)?';
          i++;
        } else {
          re += '.*';
        }
      } else {
        re += '[^/]*';
        i++;
      }
    } else if (c === '?') {
      re += '[^/]';
      i++;
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      i++;
    }
  }
  return new RegExp('^' + re + '$');
}

function changedFiles(base: string): string[] {
  try {
    const out = execSync(`git diff --name-only ${base}`, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 20_000,
    });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function matchAffected(base: string): {
  invariants: Invariant[];
  scenarioNames: Set<string> | null;
  propertyNames: Set<string> | null;
  files: string[];
} {
  const files = changedFiles(base);
  let all: Invariant[] = [];
  try {
    all = JSON.parse(fs.readFileSync(invariantsFile, 'utf-8'));
    if (!Array.isArray(all)) all = [];
  } catch {
    all = [];
  }

  const hit: Invariant[] = [];
  for (const inv of all) {
    const globs = (inv.trigger || []).map(globToRegex);
    if (globs.some((re) => files.some((f) => re.test(f)))) hit.push(inv);
  }

  // 没命中任何不变式 → 返回 null，调用方回退全量（安全默认）
  if (hit.length === 0) {
    return { invariants: [], scenarioNames: null, propertyNames: null, files };
  }

  const scenarioNames = new Set<string>();
  const propertyNames = new Set<string>();
  for (const inv of hit) {
    for (const s of inv.scenarios || []) scenarioNames.add(s);
    if (inv.property) propertyNames.add(inv.property);
  }
  return {
    invariants: hit,
    scenarioNames: scenarioNames.size ? scenarioNames : null,
    propertyNames: propertyNames.size ? propertyNames : null,
    files,
  };
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
// 验证戳
// ============================================================

function buildStamp(
  version: string,
  autoPassed: number,
  autoTotal: number,
  manual: number,
  propPassed: number,
  propTotal: number,
): string {
  const parts: string[] = [];
  parts.push(`holdout ${version}`);
  parts.push(manual > 0 ? `${autoPassed}/${autoTotal}, manual ${manual}` : `${autoPassed}/${autoTotal}`);
  if (propTotal > 0) parts.push(`props ${propPassed}/${propTotal}`);
  return `Verified-by: ${parts.join(' | ')}`;
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const version = opts.version;
  if (!version) {
    console.log(
      'Usage: npx tsx evaluate.ts <version_tag> [--skip-baseline] [--observe] [--affected[=BASE]] [--slice=NAME] [--stamp] [--properties-only] [--no-properties]',
    );
    process.exit(1);
  }

  const mode = opts.observe ? 'OBSERVE' : 'ENFORCE';
  console.log('='.repeat(56));
  console.log('IDSD Holdout Set Evaluation v3');
  console.log(`Version: ${version}`);
  console.log(`Mode:    ${mode}`);
  console.log('='.repeat(56));

  // --- 基线门禁 ---
  let baseline: Record<string, boolean> | null = null;
  if (!opts.skipBaseline) {
    console.log('\n[1/4] Baseline gate…');
    baseline = runBaseline();
    for (const [label, ok] of Object.entries(baseline)) {
      console.log(`  ${label}: ${ok ? 'PASS ✅' : 'FAIL ❌'}`);
    }
    if (Object.values(baseline).some((v) => !v)) {
      console.log('  Baseline gate failed — 先修基线，再评估场景。');
    }
  } else {
    console.log('\n[1/4] Baseline gate: skipped');
  }

  // --- affected 过滤 ---
  let affectedInfo: any = null;
  let scenarioFilter: { slice?: string | null; names?: Set<string> | null } | undefined = undefined;
  let propertyFilter: Set<string> | null = null;

  if (opts.affected !== null) {
    console.log(`\n[2/4] Affected analysis (base=${opts.affected})…`);
    const aff = matchAffected(opts.affected);
    affectedInfo = {
      base: opts.affected,
      changed_files: aff.files,
      invariants: aff.invariants.map((i) => i.id),
    };
    console.log(`  changed files: ${aff.files.length}`);
    for (const f of aff.files.slice(0, 12)) console.log(`    · ${f}`);
    if (aff.files.length > 12) console.log(`    … 及另外 ${aff.files.length - 12} 个`);

    if (aff.invariants.length === 0) {
      console.log('  ⚠️ 未命中任何不变式（或 idsd/invariants.json 缺失）→ 回退全量评估');
      affectedInfo.fallback_full = true;
    } else {
      console.log(`  hit invariants: ${aff.invariants.map((i) => `${i.id} ${i.desc}`).join('；')}`);
      scenarioFilter = { slice: opts.slice, names: aff.scenarioNames };
      propertyFilter = aff.propertyNames;
    }
  } else {
    console.log('\n[2/4] Affected analysis: disabled (full run)');
    if (opts.slice) scenarioFilter = { slice: opts.slice };
  }

  // --- 构建 app ---
  console.log('\n[3/4] Building app + evaluating…');
  await resetDatabase();
  const app = await buildApp();

  const results: Record<string, any> = {
    version,
    mode,
    observe: opts.observe,
    total: 0,
    passed: 0,
    failed: 0,
    would_fail: 0,
    manual: 0,
    baseline,
    affected: affectedInfo,
    scenarios: [],
    properties: [],
    timestamp: Math.floor(Date.now() / 1000),
  };

  // --- scenarios ---
  if (opts.runScenarios) {
    const scenarios = loadScenarios(scenarioFilter);
    if (scenarios.length === 0 && (scenarioFilter?.names || scenarioFilter?.slice)) {
      console.log('  (no scenario matched the filter)');
    }
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

      const checkResults = await runChecks(app, scenario.checks, ctx);
      for (const r of checkResults) {
        console.log(`    ${r.pass ? '✅' : '❌'} ${r.name} — ${r.detail}`);
      }
      const allPass = checkResults.every((r) => r.pass);
      // observe 模式：失败不判死，标 WOULD_FAIL
      const status = allPass ? 'PASS' : opts.observe ? 'WOULD_FAIL' : 'FAIL';
      results.total += 1;
      if (status === 'PASS') results.passed += 1;
      else if (status === 'WOULD_FAIL') results.would_fail += 1;
      else results.failed += 1;
      results.scenarios.push({
        name: scenario.name,
        category: scenario.category,
        status,
        checks: checkResults,
      });
    }
  } else {
    console.log('\n  (scenarios skipped by --properties-only)');
  }

  // --- properties ---
  let propPassed = 0;
  let propTotal = 0;
  if (opts.runProperties) {
    let props = loadProperties();
    if (propertyFilter) {
      props = props.filter((p) => propertyFilter!.has(p.id ?? '') || propertyFilter!.has(p.name));
    }
    if (props.length > 0) console.log('\n  --- Properties ---');
    for (const spec of props) {
      propTotal += 1;
      const r = await runProperty(app, spec, version);
      results.properties.push(r);
      if (r.status === 'PASS') {
        propPassed += 1;
        console.log(`    ✅ ${r.name} — ${r.runs}/${r.runs} runs (${r.elapsed_ms}ms)`);
      } else if (opts.observe) {
        propPassed += 0;
        console.log(`    ⚠️ ${r.name} — WOULD_FAIL at run #${r.failed_at_run}: ${r.detail}`);
        console.log(`       seed: ${r.seed}`);
      } else {
        console.log(`    ❌ ${r.name} — 不变式违例 at run #${r.failed_at_run}`);
        console.log(`       invariant: ${r.invariant}`);
        console.log(`       failed check: ${r.failed_check}`);
        console.log(`       detail: ${r.detail}`);
        console.log(`       counterexample: ${JSON.stringify(r.counterexample)}`);
        if (r.shrunk_variables.length) console.log(`       shrunk: ${r.shrunk_variables.join(', ')}`);
        console.log(`       seed (可复现): ${r.seed}`);
      }
    }
  } else {
    console.log('\n  (properties skipped by --no-properties)');
  }

  // --- 汇总与落盘 ---
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  const suffix = opts.observe ? '.observe' : '';
  const outFile = path.join(resultsDir, `${version}${suffix}.json`);
  results.property_summary = { total: propTotal, passed: propPassed, failed: propTotal - propPassed };
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

  await cleanupDatabase();

  const autoTotal = results.total - results.manual;
  const autoPassed = results.passed;
  const violationCount = results.failed + (propTotal - propPassed);

  console.log('\n' + '='.repeat(56));
  console.log(`Results saved: ${outFile}`);
  console.log('='.repeat(56));
  console.log(`Total scenarios: ${results.total}`);
  console.log(`Passed:          ${results.passed} ✅`);
  if (opts.observe) console.log(`Would fail:      ${results.would_fail} ⚠️  (observe 模式，不阻断)`);
  else console.log(`Failed:          ${results.failed} ❌`);
  console.log(`Manual:          ${results.manual} ⏭️`);
  if (propTotal > 0) console.log(`Properties:      ${propPassed}/${propTotal} ${propPassed === propTotal ? '✅' : '⚠️'}`);
  if (autoTotal > 0) {
    const rate = (autoPassed / autoTotal) * 100;
    console.log(`Pass rate:       ${rate.toFixed(1)}%`);
  }
  console.log('='.repeat(56));

  // --- 验证戳 ---
  if (opts.stamp) {
    const clean = violationCount === 0 && (baseline === null || Object.values(baseline).every((v) => v));
    const stamp = clean
      ? buildStamp(version, autoPassed, autoTotal, results.manual, propPassed, propTotal)
      : 'Verified-by: none（本次评估未通过，不可作为放行依据）';
    const stampFile = path.join(resultsDir, `${version}${suffix}.stamp.txt`);
    fs.writeFileSync(stampFile, stamp + '\n');
    console.log('\n┌─ Verification stamp ' + '─'.repeat(30));
    console.log(`│ ${stamp}`);
    console.log(`│ written → ${path.relative(PROJECT_ROOT, stampFile)}`);
    console.log('│ 用法：把上面这一行原样贴到 commit message 末尾');
    console.log('└' + '─'.repeat(52));
  }

  // --- 退出码：observe 恒 0；enforce 有失败才非 0 ---
  if (opts.observe) return;
  const baselineOk = baseline === null || Object.values(baseline).every((v) => v);
  if (violationCount > 0 || !baselineOk) process.exit(1);
}

main().catch((err) => {
  console.error('[evaluate] Fatal:', err);
  process.exit(1);
});
