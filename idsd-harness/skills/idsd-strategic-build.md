# Skill: idsd-strategic-build

## 一句话定位
> 全新产品能力或架构级重构 — 天级完成，全 SDLC 流程，含多 Agent 协作和完整人机会合点。

## 触发条件
用户说以下任一短语时触发：
- `/start-strategic`
- "启动战略级功能 [功能名]"
- "开始一个新能力的完整 IDSD 流程"
- "做架构级 [重构/设计]"

## 工作流概览

```
Intent → Expectations → Context → 规划 → 多 Agent 构建 → 集成验证 → Holdout 评估 → 检查点 → 验收
 Step1      Step2        Step3    Step4       Step5          Step6        Step7        Step8    Step9
```

**与 planned-build 的核心区别**：
1. 使用 **Subagent 做代码库调研**（不消耗主会话上下文窗口）
2. 规划阶段生成完整的 `feature_list.json` 作为多 Agent 之间的交接格式
3. 构建阶段通过**会话移交**机制支持长时间运行
4. **人机会合点**更多：规划后、每个切片完成后、最终验收

**状态跟踪文件**：`idsd/idsd-status.yaml`（workflow.type = strategic-build）

---

## 前三步：与 planned-build 相同

Step 1-3 与 `idsd-planned-build.md` 完全一致：
- **Step 1**：编写 Intent → `idsd/intents/{feature-name}/intent.md`
- **Step 2**：编写 Expectations → `idsd/intents/{feature-name}/expectations.md`
- **Step 3**：组装 Context → `idsd/context/context-bundle-{feature-name}.md`

按照 `idsd-planned-build.md` 中对应步骤的执行流程操作。

---

## Step 4：战略级规划

**目标**：在完整代码库调研基础上，生成可跨会话执行的详细功能列表。

**执行流程**：

1. **启动调研 Subagent**（消耗独立的上下文窗口）：
   ```
   启动一个 Subagent，任务：
   - 扫描代码库完整结构
   - 识别与本功能相关的所有模块
   - 检查哪些接口/协议需要修改或新增
   - 返回调研摘要（不超过 10 条关键发现）
   ```

2. **生成战略级功能列表**：

   **文件位置**：`idsd/plans/feature-list-{feature-name}.json`

   ```json
   {
     "feature": "{feature-name}",
     "total_slices": 6,
     "estimated_hours": 8,
     "slices": [
       {
         "id": 1,
         "name": "数据模型定义",
         "description": "定义领域模型、数据库迁移",
         "dependencies": [],
         "estimated": "1h",
         "status": "pending",
         "checkpoint": true
       },
       {
         "id": 2,
         "name": "核心业务逻辑",
         "description": "实现领域服务、业务规则",
         "dependencies": [1],
         "estimated": "2h",
         "status": "pending",
         "checkpoint": true
       }
     ],
     "checkpoints": [1, 4, 6],
     "handoff_format": "feature_list.json + progress.txt"
   }
   ```

   `checkpoint: true` 标记的切片完成后需要记录检查点。
   `handoff_format` 说明跨会话时传递什么文件。

3. **人机会合**：展示完整计划，让用户确认：
   ```
   📋 战略规划：{feature-name}
   预计耗时：~8 小时
   切片数：6 个
   
   执行路径：
   ① 数据模型定义 (~1h) ⬇
   ② 核心业务逻辑 (~2h) ⬇ 依赖 ①
   ③ API 层实现 (~1.5h) ⬇ 依赖 ②
   ④ 集成与测试 (~1.5h) ⬇ 依赖 ②③
   ⑤ 性能优化 (~1h) ⬇ 依赖 ④
   ⑥ 边界场景处理 (~1h) ⬇ 依赖 ⑤
   
   检查点：① ④ ⑥ 完成后需人工确认
   
   确认开始？(y/n)
   ```

---

## Step 5：多 Agent 构建

**目标**：通过 Subagent 和会话移交机制，长时间自主构建。

**执行流程**：

### 5.1 单个会话内的多 Agent 模式

对于可以一次完成的切片（< 30 分钟）：

```
主 Agent：协调者
  ├── Subagent（调研）：代码分析、文档查阅、只返回摘要
  ├── Subagent（构建）：实现具体代码
  └── Subagent（验证）：运行测试、检查 lint
```

每个 Subagent 拥有独立的上下文窗口，完成后只向主 Agent 返回结构化结果（摘要 + 文件列表）。

### 5.2 跨会话的移交机制

当切片任务需要跨多个 Claude Code 会话完成时：

**当前会话结束时**：
1. 确保所有代码已提交到 Git
2. 更新 `idsd/idsd-status.yaml`
3. 生成 `idsd/handoff.md`：

   ```markdown
   # Handoff Note
   **时间**：{timestamp}
   **当前进度**：切片 2/6 已完成
   **下一步**：开始切片 3（API 层实现）
   
   ## 已完成
   - 切片 1：数据模型定义 ✅
   - 切片 2：核心业务逻辑 ✅
   
   ## 关键上下文
   - 当前分支：feature/{feature-name}
   - 最新提交：{commit-hash}
   - 待用 Context Bundle：idsd/context/context-bundle-{feature-name}.md
   
   ## 注意事项
   - {构建过程中发现的重要决策或约束}
   ```

4. 输出：`⏸️ 当前会话结束。下次继续时，运行 /resume {feature-name}`

**下一个会话恢复时**：
1. 读取 `idsd/handoff.md` 恢复上下文
2. 读取 `idsd/idsd-status.yaml` 确定当前进度
3. 读取 `idsd/plans/feature-list-{feature-name}.json` 确定下一步切片
4. 继续构建

---

## Step 6：集成验证

**目标**：所有切片完成后，全量验证。

**执行流程**：

1. 运行全量测试：`go test ./...`（或对应命令）
2. 运行全量 lint
3. 运行类型检查
4. 运行架构约束检查（如果有自定义 linter）
5. 检查是否引入了已知的错误模式（对照 AGENTS.md）

---

## Step 7-9：与 planned-build 一致

- **Step 7**：运行 Holdout 评估 → 同 `idsd-planned-build.md` Step 6
- **Step 8**：记录检查点 → 同 `idsd-planned-build.md` Step 7
- **Step 9**：用户验收 → 同 `idsd-planned-build.md` Step 8

---

## 三种管道的决策参考

| 问题 | fast-build | planned-build | strategic-build |
|------|-----------|---------------|-----------------|
| 这个功能我第一次做吗？ | ❌ 不是，很明确 | ⚠️ 部分是 | ✅ 全新能力 |
| 需要完整调研代码库吗？ | ❌ 不需要 | ❌ 不需要 | ✅ 需要 |
| 任务大且不确定吗？ | ❌ 很小 | ⚠️ 中等 | ✅ 大且复杂 |
| 需要跨会话执行吗？ | ❌ 不需要 | ❌ 不需要 | ✅ 可能 |
| 需要多人确认吗？ | ❌ 不需要 | ⚠️ 几个检查点 | ✅ 多人多次确认 |
