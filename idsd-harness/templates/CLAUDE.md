# CLAUDE.md — IDSD 项目全局上下文
# ==========================================
# 这是 Claude Code 的全局上下文文件，每次会话自动加载。
# 保持 60 行以内，只放最核心的信息。
# 模块级的详细规则放子目录的 .claude.md 中。


## Stack
- 语言/框架：[如 Go 1.24 + Gin]
- 数据库：[如 PostgreSQL 16]
- 消息队列：[如 NATS]
- 部署：[如 Docker + K8s]


## Architecture
```
project-root/
├── src/
│   ├── domain/     # 领域模型和核心业务逻辑
│   ├── app/        # HTTP 路由和 handler
│   ├── infra/      # 基础设施（数据库、缓存、消息）
│   └── shared/     # 共享工具类和常量
├── tests/          # 测试文件
└── holdout/        # IDSD Holdout Set（场景文件被 .claudeignore 屏蔽）
```


## Rules
- [领域层不能依赖基础设施层]
- [所有 API 返回统一封装格式]
- [错误处理统一使用 error 包，禁止裸抛]
- [数据库操作必须走 Repository 接口，禁止直接写 SQL]
- [新增文件必须遵循已有命名规范]


## Common Tasks
- 运行测试: `go test ./...`
- 运行单个包测试: `go test ./src/domain/...`
- 构建: `go build ./...`
- 代码检查: `go vet ./...`


## IDSD Workflow
本项目使用 IDSD（Intent-Driven Software Development）流程。
进度跟踪文件：`idsd/idsd-status.yaml` — 用 `cat idsd/idsd-status.yaml` 随时查看。

可用的 Skill：
- `/start-planned-feature` — 需要设计的新功能（完整 ICE 流程）
- `/build-feature` — 小而明确的任务（轻量流程）
- `/start-strategic` — 战略级功能（全 SDLC，跨会话）
- `/evaluate` — 运行 Holdout Set 评估

Holdout Set 说明：
- `holdout/scenarios/` 被 `.claudeignore` 屏蔽，构建时 AI 不可见
- 评估时在终端执行：`python holdout/evaluate.py <version_tag>`
- 评估结果在 `holdout/results/` 下
