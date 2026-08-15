# IDSD 切片依赖追踪 — 设计文档 v1.0（已落地）

> 状态：已落地 v1（2026-08-15）。出处：把 Cordis 的 reactive coeffect 最小化移植到 IDSD。
> 拍板结果：脚本用 TypeScript（配 evaluate.ts 生态），其余按建议——版本锚点只追踪 schema、
> 声明放独立文件、三态命名 ready/stale/blocked。
> 目标：上游切片变了，harness 自动标出哪些下游要重审——不用再靠考官脑子记。

## 一、要解决的问题

IDSD 切片之间有依赖（切片 4 依赖切片 1–3 的表和 schema）。现在这个依赖在**考官脑子里**：
上游切片升了 schema、改了机制，哪些下游要重审，全靠人工判断。本设计用最小机制把这件事变成
**自动标出**。

## 二、核心思路（从 Cordis 只借一个概念）

Cordis 的 reactive coeffect：组件声明依赖的 spec，环境变化时按 spec 通知组件
（activating / deactivating / neutral）。

落到 IDSD，最简形态就是**版本比对**，不需要图、不需要事件系统：

- 每个切片声明它**建立在哪个上游的哪个版本之上**（`depends_on`）
- 每个切片声明它**对外提供了哪个版本**（`provides`）
- 检查脚本比对：上游当前版本 ≠ 下游声明依赖的版本 → 下游标 `stale`

## 三、文件设计（已落地）

### 1. `idsd/dependencies.json`（集中式清单）

选 JSON 而非 YAML：跟 `evaluate.ts` 读 front-matter 的 JSON 约定一致，`check-deps.ts` 用
标准库 `JSON.parse` 零依赖解析，不引入 js-yaml。人读的状态用 YAML（`idsd-status.yaml`），
机器解析的清单用 JSON——二分对应。

```json
{
  "_comment": "示例 = agent-chat-box 域层 5 切片真实数据",
  "slices": {
    "slice1-domain-registration": {
      "provides": { "schema": "v10" },
      "depends_on": []
    },
    "slice2-discovery-reputation": {
      "provides": { "schema": "v10" },
      "depends_on": [ { "slice": "slice1-domain-registration", "schema": "v10" } ]
    },
    "slice3-reputation-updates": {
      "provides": { "schema": "v11" },
      "depends_on": [ { "slice": "slice2-discovery-reputation", "schema": "v10" } ]
    },
    "slice4-boundaries": {
      "provides": { "schema": "v12" },
      "depends_on": [ { "slice": "slice3-reputation-updates", "schema": "v11" } ]
    },
    "slice5-domain-ui": {
      "provides": { "schema": "v12" },
      "depends_on": [ { "slice": "slice4-boundaries", "schema": "v12" } ]
    }
  }
}
```

### 2. `idsd/check-deps.ts`（检查脚本，零依赖，约 70 行）

`npx tsx idsd/check-deps.ts`（Node 24 也可直接 `node idsd/check-deps.ts`）。

逻辑要点：

```
对每个切片 S：
  depends_on 为空 → ready（无上游依赖）
  for dep in S.depends_on：
    上游不在清单 / 未声明 provides / 缺该锚点 → blocked
    上游 provides[锚点] != dep[锚点] → stale
  全部匹配 → ready
  优先级：blocked > stale > ready
```

**锚点是 `depends_on` 里除 `slice` 外的任意 key**——v1 只填 `schema`，但以后想追踪 API 契约，
加个 key 就行，脚本逻辑不用改。这比硬编码 `schema` 更简单且天然可扩展。

## 四、三态

| 状态 | 含义 | 对应 Cordis | 动作 |
|---|---|---|---|
| `ready` | 依赖的上游已就绪且版本一致 | activating | 可推进 |
| `stale` | 依赖的上游版本变了，本切片要重审 | deactivating | 考官重审 |
| `blocked` | 依赖的上游还没建好 | — | 等待 |

退出码：0 = 全部 ready；1 = 有 stale/blocked；2 = 文件缺失 / JSON 解析失败。

## 五、一个真实例子（域层 5 切片）

假设切片 3 事后被改动，schema 从 v11 升到 v13（`provides.schema` 改 `v13`），跑一次 check-deps：

```
✗ stale    slice4-boundaries  —  slice3.schema 现为 @v13（本切片建在 @v11）
✓ ready    slice5-domain-ui
```

考官重审 slice4，把它也升到 v13 后，再跑一次：

```
✗ stale    slice5-domain-ui   —  slice4.schema 现为 @v13（本切片建在 @v12）
```

**逐层传播，一次标一层**——这正好符合 IDSD 的切片顺序纪律（先 slice4 再 slice5），
不需要自动递归。

## 六、接入现有流程

在切片闭环的「⑧ 收尾」步、以及每次评估前，跑一次 `check-deps`，把 `stale` 清单贴给考官。
它不自动重跑评估、不自动改文件，只做"标出"这一件事。

## 七、v1 边界（刻意不做）

- **只追踪 schema 版本**（IDSD 里最强的版本信号），不追踪 API 契约 / 机制复用
- **不自动 hash 上游代码**，版本号人工维护在 dependencies.json
- **只标"要重审"，不自动重跑评估、不改文件**
- **不做跨切片递归传播**，靠"处理完一层再跑一次"自然逐层推进

## 八、决策点（已拍板）

1. **版本锚点** → 只追踪 `schema`（够，留扩展位）
2. **声明位置** → 独立文件 `dependencies.json`（集中、好扫描；格式从 YAML 改 JSON 以零依赖解析）
3. **三态命名** → `ready/stale/blocked`（直白，优于论文术语）
4. **脚本语言** → TypeScript（配 evaluate.ts 生态）
