# IDSD Harness — Claude Code 端到端 IDSD 开发工具链

> 一套完整的 Claude Code Skill，让你的项目具备 IDSD（Intent-Driven Software Development）能力。
> 含完整的 ICE 流程、状态跟踪、Holdout Set 评估体系。

## v2 更新（2026-08）

v2 把实战验证过的机制注入工具链（实战出处：agent-chat-box 域层，5 切片 12 轮评估 153/153 场景闭环）：

- **场景升级为可执行断言**：front-matter JSON 声明 method/url/body/expect/capture，机器判分替代人工目测
- **判卷机 `evaluate.ts`**（参考实现）：进程内 HTTP 断言、逐场景独立数据库、基线门禁、结果存档
- **失败分诊三分类**：考题问题 / 实现缺陷 / 工具问题——先判性质再谈修复，防止冤枉实现
- **出题自查清单**：状态码不臆测、操作符语义、隔离语义专门出题、BOM/CRLF 防坑

`evaluate.py` 保留为手动/轻量模式（非 Node 项目起步用），两套判卷机选一。

## v3 新增：切片依赖追踪

上游切片升版本，自动标出下游要重审的切片（把 Cordis 的 reactive coeffect 最小化到 IDSD）：

- **`idsd/dependencies.json`** — 每个切片声明 `depends_on`（建在上游哪个锚点版本之上）+ `provides`（对外提供哪个版本）
- **`idsd/check-deps.ts`** — 比对清单，输出三态：`ready` / `stale`（上游升级了要重审）/ `blocked`（上游没建好）
- **v1 边界**：只追踪 `schema` 版本，只标「要重审」不自动重跑评估；多层传播靠「处理完一层再跑一次」

---

## 快速安装（5 分钟）

### 第一步：复制文件到你的项目

```bash
# 进入你的项目根目录
cd ~/projects/myapp

# 把 idsd-harness 里的内容复制过来
cp -r /path/to/idsd-harness/templates/CLAUDE.md ./
cp -r /path/to/idsd-harness/templates/AGENTS.md ./
cp -r /path/to/idsd-harness/templates/.claudeignore ./
cp -r /path/to/idsd-harness/templates/PROJECT_PROFILE.md ./PROJECT_PROFILE.md.template
cp -r /path/to/idsd-harness/holdout/ ./holdout/
cp -r /path/to/idsd-harness/idsd/ ./idsd/
```

### 第二步：安装 Claude Code Skills

```bash
# 创建 skills 目录
mkdir -p .claude/skills

# 复制四个 Skill 文件
cp /path/to/idsd-harness/skills/*.md .claude/skills/
```

### 第三步：编辑项目配置

```bash
# 1. 编辑 CLAUDE.md — 修改技术栈、目录结构、规则为你项目的实际内容
vim CLAUDE.md

# 2. 编辑 PROJECT_PROFILE.md — 描述你的产品定位、当前阶段、关键约束
#    改完后重命名为 PROJECT_PROFILE.md（去掉 .template）
mv PROJECT_PROFILE.md.template PROJECT_PROFILE.md

# 3. 编辑 AGENTS.md — 根据你团队的习惯增删 Agent 行为规则
vim AGENTS.md

# 4. 编辑 holdout/runner-config.json — 修改 test_command 和 build_command
#    比如你的项目用 Python 就改成 pytest，用 Node 就改成 npm test
vim holdout/runner-config.json
```

### 第四步：初始化状态文件

```bash
# 确认 idsd-status.yaml 存在即可，首次使用前不需要修改
# 第一次运行 Skill 时 Agent 会自动更新它
cat idsd/idsd-status.yaml
```

---

## 安装后的项目结构

```
your-project/
├── .claudeignore               # ⭐ 屏蔽 holdout/scenarios/，构建时 AI 不可见
├── CLAUDE.md                   # ⭐ 全局上下文（技术栈、架构、规则）
├── AGENTS.md                   # ⭐ Agent 行为规则
├── PROJECT_PROFILE.md          # ⭐ 产品画像（定位、阶段、约束）
├── .claude/
│   └── skills/
│       ├── idsd-planned-build.md   # ⭐ 主 Skill：完整 ICE 流程
│       ├── idsd-fast-build.md      # ⭐ 轻量 Skill：快速修复/小功能
│       ├── idsd-strategic-build.md # ⭐ 战略 Skill：跨会话大功能
│       └── idsd-evaluate.md        # ⭐ 评估 Skill：Holdout Set 分析
├── holdout/
│   ├── evaluate.ts             # ⭐ 判卷机 v2（参考实现）：front-matter 断言自动判分（Node/Fastify）
│   ├── evaluate.py             #   手动/轻量模式（非 Node 项目起步用）
│   ├── runner-config.json      # ⭐ 评估配置
│   ├── scenarios/              # ⭐ 场景文件（被 .claudeignore 屏蔽）
│   │   ├── success/            #   成功场景示例（可执行断言 + MANUAL 两种格式）
│   │   ├── failure/            #   失败场景示例
│   │   └── boundary/           #   边界场景示例
│   └── results/                #   评估结果（自动生成）
└── idsd/
    ├── idsd-status.yaml        # ⭐ 流程状态仪表盘
    ├── dependencies.json       #   切片依赖清单（depends_on / provides）
    └── check-deps.ts           #   依赖检查器（标 stale/blocked）
```

---

## 使用指南

### 场景一：开发一个新功能（推荐初学者从这里开始）

```bash
cd ~/projects/myapp
claude-code
```

然后在 Claude Code 中输入：

```
/start-planned-feature 域层数据模型
```

Agent 会自动启动 Step 1（编写 Intent），引导你完成完整的 8 步 ICE 流程。

**过程中随时查看进度**：
```bash
# 另开一个终端（或当前会话中也可执行）
cat idsd/idsd-status.yaml
```
你会看到类似这样的输出：
```yaml
workflow:
  type: planned-build
  slice: 域层数据模型
  status: in_progress
steps:
  - id: 1
    name: 编写 Intent
    status: completed
    completed_at: "2026-06-17T10:15:00"
  - id: 2
    name: 编写 Expectations
    status: in_progress
    started_at: "2026-06-17T10:16:00"
  - id: 3
    name: 组装 Context
    status: pending
  # ... 更多步骤
summary:
  completed: 1
  in_progress: 1
  pending: 6
```

### 场景二：修一个 Bug 或加小功能

```bash
claude-code
/build-feature "给注册 API 加一个健康检查端点"
```
Agent 走 5 步轻量流程，几分钟搞定。

### 场景三：做一个大功能（需要跨会话执行）

```bash
claude-code
/start-strategic 声誉系统
```
Agent 走 9 步战略流程，包含：
- Subagent 做完整代码库调研
- 生成跨会话功能列表（`feature_list.json`）
- 每个主要切片完成后记录检查点
- 会话结束时自动产出 `handoff.md`，下个会话继续

### 场景四：跑 Holdout Set 评估（自动判分）

构建完成后，新开一个终端：

```bash
cd ~/projects/myapp
npx tsx holdout/evaluate.ts domain-v2
```

自动完成：基线门禁 → 逐场景 HTTP 断言（每场景独立全新数据库）→ 结果写入 `holdout/results/domain-v2.json`。
然后让 Agent 读取结果、做失败分诊（考题问题 / 实现缺陷 / 工具问题）、出修复建议。

> 非 Node/Fastify 项目：`python holdout/evaluate.py domain-v2`（手动模式，需自行接入断言）。

### 场景五：切片依赖检查（上游变了标下游）

每个切片闭环时，更新 `idsd/dependencies.json`（声明本切片 `provides` 的 schema 版本、以及 `depends_on` 的上游切片与版本）。想确认哪些下游要重审，跑：

```bash
npx tsx idsd/check-deps.ts
```

输出三态：`ready`（就绪）/ `stale`（上游升级了，本切片要重审）/ `blocked`（上游没建好）。
退出码 0 = 全部就绪，1 = 有 stale/blocked。多层传播靠「处理完一层再跑一次」自然逐层推进。

---

## 三种管道速查

| 管道 | 触发短语 | 适用场景 | 步数 | 耗时 | 写 Intent 文件 | 写 Expectations | Holdout 评估 |
|------|---------|---------|------|------|---------------|----------------|-------------|
| **fast-build** | `/build-feature` | Bug 修复、小功能 | 5 步 | 5-15 min | ❌ 口头确认 | ❌ | ❌ |
| **planned-build** | `/start-planned-feature` | 新功能（推荐） | 8 步 | 1-4 h | ✅ 写入文件 | ✅ 写入文件 | ✅ 跑 |
| **strategic-build** | `/start-strategic` | 战略级功能、架构重构 | 9 步 | 天级 | ✅ 写入文件 | ✅ 写入文件 | ✅ 跑 |
| **evaluate** | `跑评估` | 评估构建结果 | 5 步 | 5 min | — | — | ✅ 分析结果 |

---

## FAQ

### Q: Holdout Set 的场景文件我会被 AI 看到吗？
A: **构建时看不到**。`holdout/scenarios/` 被 `.claudeignore` 屏蔽，Claude Code 在构建模式下物理上无法读取这些文件。评估时你手动运行判卷机（`evaluate.ts` / `evaluate.py`），这是你的指令操作，不受限制。

### Q: 状态文件怎么用？
A: Agent 自动维护 `idsd/idsd-status.yaml`，你随时可以 `cat idsd/idsd-status.yaml` 查看当前进度。不需要手动编辑。

### Q: 切片依赖怎么追踪？
A: 用 `idsd/check-deps.ts`。每个切片在 `idsd/dependencies.json` 里声明「建在上游哪个版本之上」（`depends_on`）和「对外提供哪个版本」（`provides`）。上游切片升了 schema，跑 `npx tsx idsd/check-deps.ts` 会把下游标成 `stale`（要重审）或 `blocked`（上游没建好）。v1 只追踪 schema 版本，多层传播靠「处理完一层再跑一次」。锚点就是 `depends_on` 里除 `slice` 外的任意 key——以后想追踪 API 契约，加个 key 就行，不用改脚本逻辑。

### Q: 我想中途暂停，下次继续怎么办？
A: 对于 planned-build：直接关掉会话，下次用相同的命令重新开始，Agent 会读取状态文件从中断处继续。对于 strategic-build：会话结束时 Agent 会自动生成 `idsd/handoff.md`，下次运行 `/resume {feature-name}` 恢复。

### Q: 出现失败怎么办？
A: **先判性质，再谈修复**（v2 最重要的升级）：

| 性质 | 判断信号 | 处理 |
|---|---|---|
| **考题问题** | 断言与实现语义不符（状态码臆测、漏参数、`$contains` 用在数组、混入别层操作） | 修考卷，不改实现，新版本重跑 |
| **实现缺陷** | 实现行为违反 Intent/Expectations 明确语义 | 记录缺陷，发回构建代理修复 |
| **工具问题** | 场景误判 MANUAL / 解析失败（BOM/CRLF 毁 front-matter） | 修文件编码，重跑 |

**实战参照**：agent-chat-box 域层 12 轮评估，8 次失败是考题/工具问题，仅 1 次是实现缺陷——多数失败不是实现不行，是考卷没出对。

然后才是常规手段：
1. **Intent 不够精确** → 修改 `idsd/intents/{slice}/intent.md`，重新运行
2. **Context 不完整** → 补充 `CLAUDE.md` 或 `ARCHITECTURE.md`
3. **场景文件有遗漏/断言错** → 在 `holdout/scenarios/` 下增加/修正场景（对照出题自查清单）
4. **Agent 反复犯同类错误** → 在 `AGENTS.md` 中加一条规则

### Q: 状态码和匹配操作符有什么坑？
A: 实战踩过的三个：
- **状态码别臆测**：创建类端点按项目惯例是 201 不是 200（7 个场景挂在 200/201 上，全是考题问题）
- **`$contains` 只支持字符串**：数组字段要用 `{"$any": {"$eq": ...}}`
- **批量改场景文件禁用会引入 BOM/CRLF 的写回**（如 PowerShell `Set-Content`）：BOM/CRLF 破坏 front-matter 解析，场景被误判 MANUAL（切片 3 连续两轮踩坑）

### Q: 这个 Skill 和 BMAD 冲突吗？
A: **不冲突，可以共存**。BMAD 的 TEA（测试体系）、架构文档、错误模式积累都可以直接复用：
- BMAD 的架构设计文档 → `ARCHITECTURE.md`
- BMAD 中发现的 AI 常见错误 → `AGENTS.md` 中的规则
- BMAD 的测试用例 → 改造为 Holdout Set 的场景评估
- BMAD 的 CLAUDE.md → 直接保留，IDSD 的版本只是补充了 Skill 部分

---

## 自定义

### 修改 test_command 和 build_command

如果你的项目不是 Go 语言，修改 `holdout/runner-config.json`：

```json
{
  "project_root": ".",
  "test_command": "pytest",           # Python
  "build_command": "python -m build", # 或其他
  "scenarios_dir": "holdout/scenarios",
  "results_dir": "holdout/results"
}
```

其他语言的常用值：
| 语言 | test_command | build_command |
|------|-------------|---------------|
| Go | `go test ./...` | `go build ./...` |
| Python | `pytest` | `python -m build` |
| Node.js | `npm test` | `npm run build` |
| Rust | `cargo test` | `cargo build` |
| Java | `mvn test` | `mvn package` |

### 修改 Holdout Set 场景

场景文件在 `holdout/scenarios/` 下，按三类存放：
- `success/` — 成功场景（什么算完成）
- `failure/` — 失败场景（什么绝对不能发生）
- `boundary/` — 边界场景（边界情况怎么处理）

每个场景是一个 Markdown 文件，front-matter 声明可执行断言，正文写人类可读的场景描述：

````markdown
---
{
  "checks": [
    { "name": "创建域", "method": "POST", "url": "/api/domains", "body": { "name": "demo" }, "expect": { "status": 201 }, "capture": { "domainId": "id" } },
    { "name": "域在列表", "method": "GET", "url": "/api/domains?group_id=g1", "expect": { "status": 200, "json": { "$any": { "id": "{{domainId}}" } } } }
  ]
}
---
# 场景描述（给人读）
````

- `checks` 为空或缺失 → 该场景标记 **MANUAL**（人工验收），不参与通过率
- 写场景前对照 `skills/idsd-evaluate.md` 的"出题自查清单"（状态码、操作符语义、隔离边界）
- 详细断言 DSL 见 `holdout/evaluate.ts` 头部注释

### 修改 Skill 行为

四个 Skill 文件在 `.claude/skills/` 下，直接编辑即可生效：
- `idsd-planned-build.md` — 主要修改这里
- `idsd-fast-build.md` — 轻量流程
- `idsd-strategic-build.md` — 战略流程
- `idsd-evaluate.md` — 评估流程

---

## 文件清单

```
idsd-harness/
├── README.md                          # 本文件
├── skills/                            # Claude Code Skills（→ .claude/skills/）
│   ├── idsd-planned-build.md          #   主 Skill
│   ├── idsd-fast-build.md             #   轻量 Skill
│   ├── idsd-strategic-build.md        #   战略 Skill
│   └── idsd-evaluate.md              #   评估 Skill
├── templates/                         # 项目模板文件（→ 项目根目录）
│   ├── CLAUDE.md                      #   全局上下文
│   ├── AGENTS.md                      #   Agent 行为规则
│   ├── PROJECT_PROFILE.md             #   产品画像
│   └── .claudeignore                  #   Holdout 屏蔽文件
├── holdout/                           # Holdout Set 评估体系（→ 项目根目录）
│   ├── evaluate.ts                    #   判卷机 v2：front-matter 断言自动判分（Node/Fastify 参考实现）
│   ├── evaluate.py                    #   手动/轻量模式判卷机（非 Node 项目起步用）
│   ├── runner-config.json             #   评估配置
│   ├── scenarios/                     #   场景文件（可执行断言 + MANUAL 两种格式）
│   │   ├── success/                   #     成功场景示例
│   │   ├── failure/                   #     失败场景示例
│   │   └── boundary/                  #     边界场景示例
│   └── results/                       #     评估结果目录
└── idsd/                              # IDSD 运行时目录（→ 项目根目录）
    ├── idsd-status.yaml               #   流程状态仪表盘
    ├── dependencies.json              #   切片依赖清单（depends_on / provides）
    └── check-deps.ts                  #   依赖检查器（标 stale/blocked）
```
