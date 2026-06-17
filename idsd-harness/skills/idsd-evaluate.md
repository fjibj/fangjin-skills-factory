# Skill: idsd-evaluate

## 一句话定位
> IDSD 评估模式 — 让 Claude Code 帮你跑 Holdout Set 评估、分析结果、出报告。

## 触发条件
用户说以下任一短语时触发：
- "跑评估 [版本标签]"
- "run holdout [版本标签]"
- "验证一下 [版本标签]"
- "看看 [版本标签] 的构建质量"
- "帮我评估"

## 工作流概览

```
读取配置 → 运行评估脚本 → 读结果 → 分析报告 → 修复建议
  Step1        Step2        Step3    Step4      Step5
```

**状态跟踪**：使用 `idsd/idsd-status.yaml`（workflow.type = evaluate）

---

## 核心原则

1. **Agent 不修改场景文件**：`holdout/scenarios/` 下的场景文件是"考卷"，Agent 绝对不能修改
2. **Agent 不修改评估脚本**：`evaluate.py` 是"判卷机"，Agent 不能改逻辑
3. **Agent 只分析结果**：读取 `results/` 下的 JSON 结果，分析失败原因，提修复建议

---

## Step-by-step

### Step 1：读取配置

1. 检查 `holdout/runner-config.json` 是否存在
2. 如果存在，读取配置了解评估参数
3. 如果不存在，创建默认配置：

**文件**：`holdout/runner-config.json`

```json
{
  "project_root": ".",
  "scenarios_dir": "holdout/scenarios",
  "results_dir": "holdout/results",
  "test_command": "go test ./...",
  "build_command": "go build ./..."
}
```

### Step 2：运行评估

1. 确定版本标签（从用户输入提取，或使用当前日期）
2. 输出运行指令给用户：

```
🔄 开始 Holdout 评估：{version_tag}

请在终端执行：
  python holdout/evaluate.py {version_tag}

评估完成后告诉我结果。
```

3. 用户手动运行后，告诉你结果

### Step 3：读取结果

1. 读取 `holdout/results/{version_tag}.json`
2. 解析评估数据

### Step 4：生成分析报告

输出结构化评估报告：

```markdown
## 📋 Holdout 评估报告：{version_tag}

### 总体情况
| 指标 | 数值 |
|------|------|
| 总场景数 | 7 |
| 通过 | 6 ✅ |
| 失败 | 1 ❌ |
| 通过率 | 85.7% |

### ✅ 通过的场景
- 新群申请加入域 (success) ✓
- 跨群能力发现 (success) ✓
- 信誉更新 (success) ✓
- ...

### ❌ 失败的场景

**场景**：恶意群刷信誉 (failure)
**期望行为**：连续 5 次协作评分异常的群被自动降级
**实际结果**：评分降级触发条件中的阈值与实际实现不一致
**修复建议**：
1. 检查 `src/domain/reputation.go` 中第 45 行的阈值配置
2. 确认 `isMalicious()` 函数的连续失败计数逻辑
3. 建议修改评分降级阈值从 3 改为 5

### 📊 趋势对比
| 版本 | 通过率 |
|------|--------|
| domain-v1 | 71.4% (5/7) |
| domain-v2 | 85.7% (6/7) ↑ |

### 总体评价
{summary}
```

### Step 5：修复建议（如果有失败）

如果存在失败场景：

1. 分析代码中对应的实现逻辑
2. 定位根因（而不是症状）
3. 提出具体的修复方案
4. 询问用户是否要修复

```
建议修复路径：
1. 修改 {文件路径} 中第 {行号} 的 {变量/逻辑}
2. 预期修复后该场景应通过
3. 修复后重新运行评估

开始修复？(y/n)
```

如果用户同意，切换到构建模式进行修复。

---

## 与构建 Skill 的协作模式

```
# 构建会话
claude-code
→ 运行 idsd-planned-build
→ 构建完成后告知用户版本标签

# 评估会话（新终端 / 新会话）
claude-code
→ "跑评估 domain-v2"
→ AI 读取 evaluate.py → 指导你运行 → 分析结果 → 出报告
```

两个会话互不干扰。构建会话的 AI 看不到场景文件（被 `.claudeignore` 屏蔽），评估会话的 AI 通过你手动运行脚本间接访问。
