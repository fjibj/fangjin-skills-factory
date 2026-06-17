# IDSD Harness — Claude Code 端到端 IDSD 开发工具链

> 一套完整的 Claude Code Skill，让你的项目具备 IDSD（Intent-Driven Software Development）能力。
> 含完整的 ICE 流程、状态跟踪、Holdout Set 评估体系。

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
│   ├── evaluate.py             # ⭐ 场景评估脚本
│   ├── runner-config.json      # ⭐ 评估配置
│   ├── scenarios/              # ⭐ 场景文件（被 .claudeignore 屏蔽）
│   │   ├── success/            #   成功场景示例
│   │   ├── failure/            #   失败场景示例
│   │   └── boundary/           #   边界场景示例
│   └── results/                #   评估结果（自动生成）
└── idsd/
    └── idsd-status.yaml        # ⭐ 流程状态仪表盘
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

### 场景四：跑 Holdout Set 评估

构建完成后，新开一个终端：

```bash
cd ~/projects/myapp
claude-code
```

然后输入：

```
跑评估 domain-v2
```

Agent 会引导你手动执行 `python holdout/evaluate.py domain-v2`，然后自动读取结果、分析失败原因、出修复建议。

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
A: **构建时看不到**。`holdout/scenarios/` 被 `.claudeignore` 屏蔽，Claude Code 在构建模式下物理上无法读取这些文件。评估时你手动运行 `evaluate.py`，这是你的指令操作，不受限制。

### Q: 状态文件怎么用？
A: Agent 自动维护 `idsd/idsd-status.yaml`，你随时可以 `cat idsd/idsd-status.yaml` 查看当前进度。不需要手动编辑。

### Q: 我想中途暂停，下次继续怎么办？
A: 对于 planned-build：直接关掉会话，下次用相同的命令重新开始，Agent 会读取状态文件从中断处继续。对于 strategic-build：会话结束时 Agent 会自动生成 `idsd/handoff.md`，下次运行 `/resume {feature-name}` 恢复。

### Q: 出现失败怎么办？
A:
1. **Intent 不够精确** → 修改 `idsd/intents/{slice}/intent.md`，重新运行
2. **Context 不完整** → 补充 `CLAUDE.md` 或 `ARCHITECTURE.md`
3. **场景文件有遗漏** → 在 `holdout/scenarios/` 下增加场景
4. **Agent 反复犯同类错误** → 在 `AGENTS.md` 中加一条规则

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

每个场景是一个 Markdown 文件，包含场景描述和期望行为。你可以根据你的项目增删改。

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
│   ├── evaluate.py                    #   评估脚本
│   ├── runner-config.json             #   评估配置
│   ├── scenarios/                     #   场景文件
│   │   ├── success/                   #     成功场景示例
│   │   ├── failure/                   #     失败场景示例
│   │   └── boundary/                  #     边界场景示例
│   └── results/                       #     评估结果目录
└── idsd/                              # IDSD 运行时目录（→ 项目根目录）
    └── idsd-status.yaml               #   流程状态仪表盘
```
