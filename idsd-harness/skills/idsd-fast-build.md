# Skill: idsd-fast-build

## 一句话定位
> 小而明确的任务 — 分钟级完成，轻量 ICE 流程，适合修 Bug、加小功能、改配置。

## 触发条件
用户说以下任一短语时触发：
- `/build-feature`
- /build "修复 [问题]"
- "快速实现 [小功能]"
- "改一下 [模块]"
- /fix [bug描述]

## 工作流概览

```
Intent → Context → 构建 → 验证 → 完成
 Step1    Step2    Step3   Step4   Step5
```

**状态跟踪文件**：`idsd/idsd-status.yaml`
（使用 fast-build 时只记录 5 步，workflow.type = fast-build）

---

## 步骤详解

### Step 1：Intent（一句话 + 边界）

**目标**：30 秒内确认要做什么。

**不需要写文件**，只需要用户一句话确认：

> 用户：/build "给域注册 API 加一个健康检查端点"
> Agent：确认一下：
> - Goal：域注册 API 增加 `/health` 端点，返回服务状态
> - 边界：不修改现有注册逻辑，只加端点
> 开始？(y/n)

用户确认后直接进入 Step 2。

### Step 2：读取 Context

**目标**：快速获取相关代码的上下文。

**执行**：
1. 读取 `CLAUDE.md` 了解项目规则
2. 扫描涉及的文件（通过 grep/match 定位相关代码）
3. 不生成 Context Bundle 文件（轻量级不需要）

### Step 3：构建

**目标**：实现功能，不改动无关代码。

**执行**：
1. 直接修改/新增文件
2. 遵循项目编码规范
3. **不询问**技术实现细节

### Step 4：验证

**目标**：确保功能正确。

**执行**：
1. 运行相关测试：`go test ./src/domain/...`（或对应命令）
2. 运行 lint：`go vet ./...`
3. 如果失败 → 修复 → 重跑（最多 2 次循环）

### Step 5：完成

**目标**：输出变更摘要。

```
✅ /build-feature 完成

变更摘要：
📄 修改：src/app/domain_route.go（+15 行）
📄 新增：src/app/health.go（+28 行）
✅ 测试通过
✅ Lint 通过

耗时：8 分钟
```

---

## 与 planned-build 的区别

| 维度 | fast-build | planned-build |
|------|-----------|---------------|
| 适用场景 | Bug 修复、小功能 | 需要设计的新功能 |
| 写 Intent 文件 | ❌ 不写，口头确认 | ✅ 写入 idsd/intents/ |
| 写 Expectations | ❌ 不写 | ✅ 写入 idsd/intents/ |
| Context Bundle | ❌ 不生成 | ✅ 生成 |
| 功能切片 | ❌ 不分片 | ✅ 拆分为 3-5 个子切片 |
| Holdout 评估 | ❌ 不跑 | ✅ 跑 |
| 状态文件 | ✅ 更新 | ✅ 更新 |
| 预计耗时 | 5-15 分钟 | 1-4 小时 |
