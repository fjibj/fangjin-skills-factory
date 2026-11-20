# Skill: idsd-evaluate

## 一句话定位
> IDSD 评估模式 — 跑 Holdout Set 自动判分（场景 + 属性）、区分「考题问题 vs 实现缺陷」、出修复建议、打验证戳。

## 触发条件
用户说以下任一短语时触发：
- "跑评估 [版本标签]"
- "run holdout [版本标签]"
- "验证一下 [版本标签]"
- "看看 [版本标签] 的构建质量"
- "帮我评估"
- "只跑受影响的部分" / "跑 affected"

## 工作流概览

```
判定模式 → 运行评估 → 读结果 → 失败分诊 → 打戳/收尾
  Step1      Step2       Step3     Step4       Step5
     │
     └─ 新场景首轮必须走 observe（只记录不判死）
```

**状态跟踪**：使用 `idsd/idsd-status.yaml`（workflow.type = evaluate）

---

## 核心原则（考官纪律）

1. **考卷隔离**：`holdout/scenarios/` 与 `holdout/properties/` 是"考卷"，构建代理全程不可见
   （`.claudeignore` 物理屏蔽 + 构建任务红线双重保障）。
2. **判卷机只读**：`evaluate.ts` / `evaluate.py` 是"判卷机"，评估时不能改它的逻辑。
3. **评估会话 ≠ 构建会话**：考官（评估者）与构建代理必须分离——
   构建代理不可见考卷，考官不可参与构建。这是「盲考闭环」的第三根支柱。
4. **评估用新版本标签**：每次评估用新的 version tag（`slice1-v1`、`slice1-v2`…），
   失败轮次的结果也存档——它是「考题问题 vs 实现缺陷」判别的证据链。
5. **新场景先 observe，再 enforce**（v3 新增）：
   新写的场景/属性首轮必须用 `--observe` 跑，只记录"本会失败"，不判死。
   人工确认里面没有出题错误（状态码、操作符、参数）之后，才切 enforce。
   **理由**：实战 12 轮里 8 次失败是出题问题——让出题错误先撞软墙，不冤枉实现。

---

## 步骤详解

### Step 1：判定模式

问自己两个问题：

| 问题 | 答案 | 动作 |
|---|---|---|
| 这批场景/属性是**第一次**跑吗？ | 是 | `--observe` |
| 上一轮 observe 里失败的项，确认全是考题问题吗？ | 是（已修断言） | 切 `--enforce` |

在 `idsd/idsd-status.yaml` 记录当前成熟度：

```yaml
holdout:
  maturity: observe          # observe | enforce
  observe_runs: 1            # observe 跑过几轮
```

**默认保守**：不确定就 observe。observe 的代价是多跑一轮，enforce 误判的代价是冤枉实现、白改代码。

### Step 2：运行评估

```bash
# 全量（场景 + 属性）
npx tsx holdout/evaluate.ts {version}

# 新场景首轮：观察模式（不阻断，结果写 <version>.observe.json）
npx tsx holdout/evaluate.ts {version} --observe

# 只跑 git diff 命中的不变式（日常回归用，替代全量）
npx tsx holdout/evaluate.ts {version} --affected
npx tsx holdout/evaluate.ts {version} --affected=origin/main

# 只跑本切片（场景文件名前缀匹配）
npx tsx holdout/evaluate.ts {version} --slice=slice4

# 只跑其中一类
npx tsx holdout/evaluate.ts {version} --properties-only
npx tsx holdout/evaluate.ts {version} --no-properties

# 通过后打验证戳
npx tsx holdout/evaluate.ts {version} --stamp
```

**参数速查**

| 参数 | 作用 |
|---|---|
| `--skip-baseline` | 跳过基线门禁（快速迭代） |
| `--observe` | 观察模式：失败标 `WOULD_FAIL`，退出码恒 0，结果写 `.observe.json` |
| `--affected[=BASE]` | 按 `git diff BASE` 命中 `idsd/invariants.json` 的 trigger，只跑相关场景/属性；BASE 默认 `HEAD`（比较工作区）；未命中则回退全量 |
| `--slice=NAME` | 只跑场景名以 NAME 开头的 |
| `--properties-only` | 只跑属性测试 |
| `--no-properties` | 只跑场景 |
| `--stamp` | 通过后写 `<version>.stamp.txt` 并打印可粘贴的 `Verified-by:` 行 |

- 基线门禁（test + typecheck）跑一次，失败则先修基线。
- 每个场景/每次属性迭代都用全新数据库，互不污染。
- 结果写入 `holdout/results/{version}.json`（observe 模式为 `{version}.observe.json`）。

### Step 3：读结果

读取结果 JSON，汇总：
- **场景**：通过 / 失败 / WOULD_FAIL / MANUAL 计数与通过率
- **属性**：`property_summary` 里 total / passed / failed
- 失败项逐个列出（场景名 + 失败 check + 实际响应；属性名 + 反例 + seed）

### Step 4：失败分诊（最关键的一步）

**先判性质，再谈修复。** 失败来源分四类，处理方式完全不同：

| 性质 | 判断信号 | 处理 |
|---|---|---|
| **考题问题** | 失败详情显示**断言与实现语义不符**：状态码臆测（如断言 200 而实现按 REST 惯例返回 201）、漏传参数、匹配操作符误用（如 `$contains` 用在数组上）、场景引用了不属于本切片数据面的操作 | **修考卷**（改断言/补参数/删多余 check），**不是改实现**。修完用新版本标签重跑 |
| **实现缺陷** | 实现行为**违反 Intent/Expectations** 的明确语义（实战例：切片 4 信誉不跨域隔离——域 A 评分污染域 B 信誉） | 记录缺陷描述，**发回构建代理修复**（新会话或 follow_up，红线不变，不可透露考卷） |
| **属性违例**（v3 新增） | property 结果 `status=FAIL` 且 `judge_issue=false`：给出了**最小反例**（counterexample）与可复现 seed | 说明存在一类输入使不变式不成立 → **实现缺陷**，把 counterexample 原样附给构建代理 |
| **工具问题** | 场景文件被误判 MANUAL / 解析失败——通常是 **BOM/CRLF 破坏了 front-matter**（批量改场景时用带 UTF-8 BOM 的编辑器或 PowerShell 写回导致） | 修文件编码（去 BOM、LF 行尾），重跑 |

**property 的额外判别**：若结果里 `judge_issue=true`，说明失败发生在 `steps`（前置造数据）而非 `assert`——**这是出题问题**，属性本身没被验证，不要当实现缺陷处理。

**实战参照**：agent-chat-box 域层 12 轮评估，8 次失败是考题/工具问题，仅 1 次是实现缺陷——
**多数失败不是实现不行，是考卷没出对。分诊错了会把实现冤枉成坏的。**

**轮次上限**：同一缺陷连续被挡 2 轮仍未通过 → 标 `waived`，在 checkpoint.md 记录原因与风险，
转入 MANUAL 清单由人判断。**不要无限重试**（v3 新增，防止构建代理卡死在轮次上限）。

### Step 5：打戳与收尾

- 通过后重跑一次带 `--stamp`，得到一行：

  ```
  Verified-by: holdout slice4-v2 | 39/39, manual 26/26 | props 2/2
  ```

- **把这一行原样贴到 commit message 末尾**。没跑验证的提交写 `Verified-by: none`。
- 考题问题 → 列出断言修改点，直接改场景文件，重跑。
- 实现缺陷 → 给出缺陷描述 + 修复方案（不改实现本身，由构建代理改），重跑。
- 全部通过 → 更新 `idsd-status.yaml`，进入检查点（Step 7 of planned-build）。

---

## 出题自查清单（写场景时对照，防患于未然）

写 `holdout/scenarios/` 下的场景时，逐条自查：

- [ ] **链路能真实走通吗**？场景的每一步 setup 都走 HTTP API，不依赖内部状态
- [ ] **状态码是查过的吗**？创建类端点按项目惯例是 201 还是 200？——别臆测
- [ ] **匹配操作符语义对了吗**？`$contains` 只支持字符串；数组用 `$any/$all/$none` 包裹
- [ ] **场景只测本切片的数据面吗**？别把别的层/别的切片的操作混进来
- [ ] **断言的值是确定性的吗**？信誉分等数值要在场景里精确推演（完成 +1、评分 -2 等）
- [ ] **隔离/边界语义专门出题了吗**？"A 域事件不污染 B 域"这类聚合边界最容易漏实现缺陷
- [ ] **文件是 UTF-8 无 BOM、LF 行尾吗**？改场景文件用 write 工具，别用会引入 BOM/CRLF 的写回
- [ ] **无法用 API 断言表达的**（UI 呈现、宕机、端到端人工流程）→ `"checks": []` 标 MANUAL

## 写 property 时自查（v3 新增）

- [ ] **不变式是真不变量吗**？必须是"对所有输入都必须成立"的陈述，不是"某个例子期望如此"
- [ ] **variables 给了合理生成范围吗**？范围太窄抓不到缺陷，太宽则反例难解释
- [ ] **steps 只负责造数据，assert 只负责验不变量吗**？混在一起会让失败性质难以判别
- [ ] **数字参数用 `"{{var}}"` 整占位**（会保留 number 类型）；拼在字符串里会变成文本
- [ ] **reference 实现要有一条能过的属性**（如幂等），用来证明不是全在报错
- [ ] **runs 起步 20–30 就够**：种子确定性，失败可复现，不必靠堆次数

---

## 版本与证据链

```
holdout/results/
├── slice1-v1.json          # 失败（考题问题：评估器未注册新路由）
├── slice1-v2.json          # 通过 16/16
├── slice4-v1.json          # 失败（实现缺陷：信誉不隔离）← 关键证据
├── slice4-v2.json          # 通过 39/39
├── slice4-v2.stamp.txt     # Verified-by: holdout slice4-v2 | 39/39 | props 2/2
└── slice5-v1.observe.json  # 观察模式：只记录 WOULD_FAIL，未阻断
```

**失败轮次必须存档**：修复前后对比是证明"缺陷真实存在且已修复"的唯一证据。
**observe 轮次也要存档**：它是"出题误报有多少"的唯一度量来源。
