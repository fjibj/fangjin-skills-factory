# Skill: idsd-planned-build

## 一句话定位
> 需要设计但不需要完整发现的 IDSD 功能开发 — 小时级完成，完整 ICE 流程，自动状态跟踪。

## 触发条件
用户说以下任一短语时触发：
- `/start-planned-feature`
- "用 IDSD 开发 [功能名]"
- "开始做 [切片名] 切片"
- "跑一下 planned build"
- "启动 IDSD 流程"

## 工作流概览

```
Intent → Expectations → Context → 规划 → 构建 → 评估 → 检查点 → 验收
  Step1     Step2        Step3    Step4   Step5   Step6    Step7     Step8
```

**状态跟踪**：每一步自动更新 `idsd/idsd-status.yaml`，用户随时 `cat idsd/idsd-status.yaml` 查看进度。

---

## 全局规则

### 状态文件操作守则

每次步骤转换时必须更新 `idsd/idsd-status.yaml`：

```yaml
# 开始一个步骤时
steps:
  - id: N
    status: in_progress
    started_at: "<current-iso-time>"

# 完成一个步骤后
  - id: N
    status: completed
    completed_at: "<current-iso-time>"
    artifacts: ["<产出文件路径>"]

# 步骤失败时
  - id: N
    status: failed
    # 在 errors 中追加原因

# 每次更新后重新计算 summary
summary:
  total_steps: 8
  completed: <计数>
  in_progress: <计数>
  pending: <计数>
  failed: <计数>
```

### 交互原则

1. **能不问就不问**：Agent 能自主决定的（技术方案、代码实现路径），不要问用户。只在意图不明确或需要用户确认关键决策时询问。
2. **一步一问**：每个步骤开始时，用一条消息说明"现在在做什么、预计产出什么"，完成后用一条消息说明"完成、产出了什么"。不要在一个消息里讨论多个步骤。
3. **失败时带分析**：如果某步骤失败，先分析原因再问用户如何处理，而不是直接扔给用户"失败了怎么办"。

### 输出风格

每步完成时输出类似：
```
✅ Step N: [步骤名称] — 完成
   📄 产出：path/to/file.md
   ⏱ 耗时：X 分钟
```

---

## 步骤详解

### Step 1：编写 Intent

**目标**：产出一个 5-7 行的 Intent 文件，包含 Goal、Constraints、Failure Conditions。

**执行流程**：

1. 检查 `idsd/intents/` 下是否已有该切片的 Intent 文件
   - 如果有 → 读取并确认是否需要修改
   - 如果没有 → 进入第 2 步

2. 确定功能切片名称（从用户输入提取，或询问用户："这个切片叫什么名字？"）

3. 用三个问题引导用户写出 Intent（只问这三个，不要多问）：
   ```
   ① Goal：你要为谁解决什么问题？
   ② Constraints：结果必须具备哪些质量属性？（3-5 条）
   ③ Failure Conditions：什么是绝对不可接受的底线？（2-3 条）
   ```

4. 将用户回答整理为结构化 Intent 文件：

   **文件位置**：`idsd/intents/{slice-name}/intent.md`

   ```markdown
   # Intent: {slice-name}

   ## Goal
   {用户回答}

   ## Constraints
   - {约束 1}
   - {约束 2}
   - {约束 3}

   ## Failure Conditions
   - {失败条件 1}
   - {失败条件 2}
   ```

5. **更新状态文件**：Step 1 → completed

6. 输出：
   ```
   ✅ Step 1: 编写 Intent — 完成
      📄 产出：idsd/intents/{slice-name}/intent.md
   ```

---

### Step 2：编写 Expectations

**目标**：产出一个场景化的 Expectations 文件，定义什么算完成、什么算失败、什么算越界。

**执行流程**：

1. 读取 Step 1 产出的 `intent.md`

2. 根据 Intent 内容，引导用户定义场景（最多 3 轮对话，不要反复确认）：

   **成功场景**（2-3 个）："在什么情况下系统表现出什么行为算'完成'？"
   ```
   示例：
   | 场景 | 期望行为 |
   |------|----------|
   | 新群申请加入域 | 群提交能力声明后，域在 10 秒内完成注册，该群的能力对其他群可见 |
   ```

   **失败场景**（1-2 个）："什么情况下算'系统正确拒绝了不该做的事'？"
   ```
   示例：
   | 场景 | 期望行为 |
   |------|----------|
   | 恶意群刷信誉 | 连续 N 次协作评分异常的群被自动降级 |
   ```

   **边界场景**（1-2 个）："边界情况应该怎么处理？"
   ```
   示例：
   | 场景 | 期望行为 |
   |------|----------|
   | 群同时属于多个域 | 每个域独立维护该群的信誉，不跨域传播 |
   ```

3. 生成 Expectations 文件：

   **文件位置**：`idsd/intents/{slice-name}/expectations.md`

   ```markdown
   # Expectations: {slice-name}

   ## Success Scenarios
   | 场景 | 期望行为 |
   |------|----------|
   | ... | ... |

   ## Failure Scenarios
   | 场景 | 期望行为 |
   |------|----------|
   | ... | ... |

   ## Boundary Scenarios
   | 场景 | 期望行为 |
   |------|----------|
   | ... | ... |
   ```

   **关键规则**：Expectations 用**用户语言**写，不要写技术细节。例如写"用户能看到搜索结果且响应在 2 秒内"，而不是"接口返回 200，延迟 < 2s"。

4. **更新状态文件**：Step 2 → completed

5. 输出：
   ```
   ✅ Step 2: 编写 Expectations — 完成
      📄 产出：idsd/intents/{slice-name}/expectations.md
   ```

---

### Step 3：组装 Context

**目标**：从项目各处的 Context 来源自动收集信息，生成一个完整的上下文包供构建使用。

**执行流程**：

1. 自动读取以下文件（存在则读）：
   - `CLAUDE.md` — 技术栈、目录结构、通用规则
   - `AGENTS.md` — Agent 行为约束
   - `PROJECT_PROFILE.md` — 产品定位、当前阶段、关键约束
   - `docs/ARCHITECTURE.md` — 架构决策记录

2. 扫描代码库结构：
   - 列出 `src/` 下的主要目录和模块
   - 识别可复用的接口、协议、工具模块

3. 生成 Context Bundle：

   **文件位置**：`idsd/context/context-bundle-{slice-name}.md`

   ```markdown
   # Context Bundle: {slice-name}

   ## 项目概览
   （来自 PROJECT_PROFILE.md 的摘要）

   ## 技术栈
   （来自 CLAUDE.md 的摘要）

   ## 架构规则
   （来自 AGENTS.md + ARCHITECTURE.md 的摘要）

   ## 代码库地图
   ```
   src/
   ├── shared/         # 可复用的共享模块
   ├── domain/         # 领域模型
   ├── app/            # API 层
   └── infra/          # 基础设施
   ```

   ## 本切片相关的已有代码
   （列出与本切片直接相关的现有文件和模块）

   ## 本切片专属 Intent
   （来自 Step 1 的 intent.md）

   ## 本切片专属 Expectations
   （来自 Step 2 的 expectations.md — 注意：这是给 Agent 参考用的摘要，
    完整场景文件在 holdout/scenarios/ 中，构建代理不应读取）
   ```

4. **更新状态文件**：Step 3 → completed

5. 输出：
   ```
   ✅ Step 3: 组装 Context — 完成
      📄 产出：idsd/context/context-bundle-{slice-name}.md
   ```

---

### Step 4：规划实现路径

**目标**：将功能拆分为可独立构建的子切片，生成功能列表。

**执行流程**：

1. 根据 Intent 和 Context，将功能拆分为 3-5 个可独立构建和验证的子切片

2. 每个子切片遵循原则：
   - 可独立测试
   - 可在 30 分钟内完成构建
   - 依赖关系明确（前一个切片是后一个的前提）

3. 生成功能列表：

   **文件位置**：`idsd/plans/feature-list-{slice-name}.json`

   ```json
   {
     "slice": "{slice-name}",
     "slices": [
       {
         "id": 1,
         "name": "数据模型定义",
         "description": "定义领域模型、数据库表结构",
         "dependencies": [],
         "estimated_minutes": 20,
         "status": "pending"
       },
       {
         "id": 2,
         "name": "核心 API 实现",
         "description": "实现注册/发现/查询 API",
         "dependencies": [1],
         "estimated_minutes": 30,
         "status": "pending"
       }
     ]
   }
   ```

4. **更新状态文件**：Step 4 → completed，同时将子切片填入 Step 5 的 sub_steps

5. 输出切片计划让用户快速确认：
   ```
   ✅ Step 4: 规划实现路径 — 完成
      📄 产出：idsd/plans/feature-list-{slice-name}.json
      
   切片计划：
   ① 数据模型定义（~20min）
   ② 核心 API 实现（~30min）→ 依赖 ①
   ③ ...
   
   开始构建前需要确认吗？(y/n)
   ```

---

### Step 5：逐切片构建

**目标**：按顺序自主构建每个子切片，每个完成后运行测试。

**执行流程**：

对每个子切片按顺序执行：

1. **开始子切片**：
   - 更新 `idsd-status.yaml` 中对应 sub_step → in_progress
   - 输出：`🔄 切片 [N/N]: {切片名} — 开始构建`

2. **构建**：
   - 读取 Context Bundle 了解约束
   - 自主实现代码（不询问用户技术细节）
   - 遵循项目已有的编码规范和架构规则
   - 每个文件生成后自动保存

3. **验证**：
   - 运行项目测试命令（`go test ./...` / `pytest` 等）
   - 如果测试失败 → 修复 → 重新测试（最多 3 次循环）
   - 3 次循环后仍失败 → 标记子切片为 failed，记录原因

4. **完成子切片**：
   - 更新状态文件对应 sub_step → completed
   - 输出：`✅ 切片 [N/N]: {切片名} — 完成（+X 文件，+Y 行代码）`

5. **所有子切片完成后**：
   - 更新 Step 5 → completed
   - 输出构建摘要

---

### Step 6：运行 Holdout 评估

**目标**：用 holdout 场景验证构建结果，Agent 不能提前看到场景文件。

**执行流程**：

1. **说明规则**：向用户说明接下来要运行 Holdout Set 评估，需要用户手动执行

   ```
   ⚠️ Step 6: Holdout 评估需要手动运行
   
   为了保持评估的公正性，请在新的终端中执行：
   
   python holdout/evaluate.py {slice-name}-v1
   
   评估完成后，把结果告诉我就行，我来分析。
   ```

2. **用户提供评估结果后**：
   - 读取 `holdout/results/{slice-name}-v1.json`
   - 分析失败场景（如果有）

3. **评估结果处理**：
   - **全部通过** → Step 6 → completed，进入 Step 7
   - **部分失败** → 分析失败原因，提供修复建议，询问用户是否修复

4. **更新状态文件**

---

### Step 7：记录检查点

**目标**：记录当前已通过验证的 Expectations 和构建状态，形成可追溯的检查点。

**执行流程**：

1. 汇总本次构建的所有产出：
   - Intent 文件
   - Expectations 文件
   - Context Bundle
   - 功能列表
   - 代码文件列表
   - 评估结果

2. 生成检查点文件：

   **文件位置**：`idsd/checkpoints/checkpoint-{slice-name}-{timestamp}.md`

   ```markdown
   # Checkpoint: {slice-name}
   **时间**：{timestamp}
   **状态**：✅ 通过

   ## 已通过的 Expectations
   - Success: N/N
   - Failure: N/N
   - Boundary: N/N

   ## 构建产出
   - 新增文件：X 个
   - 修改文件：Y 个
   - 代码行数：+Z

   ## 待办
   - （如果有未完成的切片）
   ```

3. **更新状态文件**：Step 7 → completed

---

### Step 8：用户验收

**目标**：用户确认交付物满足意图。

**执行流程**：

1. 生成交付摘要：
   ```
   📋 交付摘要：{slice-name}
   
   Intent 回顾：{Goal 一句话}
   
   已完成：
   ✅ {切片1} — {文件列表}
   ✅ {切片2} — {文件列表}
   
   评估结果：
   ✅ 成功场景：N/N 通过
   ✅ 失败场景：N/N 通过
   ✅ 边界场景：N/N 通过
   
   耗时：{总耗时}
   ```

2. 询问用户是否接受交付物

3. 根据用户反馈：
   - **接受** → 更新状态文件，workflow.status → completed
   - **不接受** → 记录反馈到 errors，回到 Step 5 或 Step 1
   - **需要调整** → 记录修改要求，回到对应步骤

---

## 完整工作流示例

用户输入：`/start-planned-feature 域层数据模型`

Agent 执行过程（自动推进，用户只需在关键节点确认）：

```
🔄 Step 1: 编写 Intent — 开始
   问：这个切片要解决什么问题？
   答：[用户回答]
✅ Step 1: 编写 Intent — 完成

🔄 Step 2: 编写 Expectations — 开始
   问：什么算完成？什么算失败？
   答：[用户回答]
✅ Step 2: 编写 Expectations — 完成

🔄 Step 3: 组装 Context — 开始
   → 读取 CLAUDE.md、AGENTS.md、PROJECT_PROFILE.md...
   → 扫描代码库结构...
✅ Step 3: 组装 Context — 完成

🔄 Step 4: 规划实现路径 — 开始
   → 拆分为 3 个子切片...
✅ Step 4: 规划实现路径 — 完成
   确认切片计划？(y/n) → y

🔄 Step 5: 逐切片构建 — 开始
   🔄 切片 1/3: 数据模型定义...
   ✅ 切片 1/3: 完成
   🔄 切片 2/3: 注册 API 实现...
   ✅ 切片 2/3: 完成
   🔄 切片 3/3: 集成测试...
   ✅ 切片 3/3: 完成
✅ Step 5: 逐切片构建 — 完成

⚠️ Step 6: 请手动运行评估...
   [用户运行 evaluate.py]
   → 评估结果：全部通过 ✅
✅ Step 6: 评估完成

✅ Step 7: 检查点已记录
✅ Step 8: 用户验收完成
🎉 IDSD 流程完成！
```

---

## ICE 编写自查表

写 Intent/Expectations 时，用以下标准自我审查：

### Intent 自查
- [ ] Goal 是否描述了"为谁解决什么问题"而不是"用什么技术实现"？
- [ ] Constraints 是否 ≤ 5 条？如果太多，里面混入了"伪装成约束的规格"
- [ ] Failure Conditions 是否是二进制检查？（通过/不通过，没有中间状态）
- [ ] 换成另一种技术实现，这段描述是否依然成立？

### Expectations 自查
- [ ] 成功场景是否用用户语言写的？（不是技术测试用例）
- [ ] 失败场景是否覆盖了"绝对不能发生的事"？
- [ ] 边界场景是否考虑了"多域归属"这类交叉情况？
- [ ] 场景文件是否放在 `holdout/scenarios/` 目录下？（不在 `idsd/intents/` 下）
