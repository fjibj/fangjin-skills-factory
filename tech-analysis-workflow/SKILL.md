# tech-analysis-workflow Skill

技术选型分析全流程 Skill - 从候选技术检索到知识库上传的完整工作流。

---

## 概述

这是一个**工作流程编排 Skill**，整合了技术研究、分析对比、文档生成、知识库上传的完整流程。

**适用场景**：
- 技术选型决策
- 架构方案对比
- 工具/框架评估
- 技术趋势研究

---

## 依赖说明

**本 Skill 需要配合以下独立 Skill/工具使用：**

| 依赖 | 用途 | 安装/配置 |
|------|------|----------|
| `docx-generator` | 生成 Word 文档 | 已包含在本仓库中 |
| `ima-skills` | 上传知识库 | MCP server 配置 |
| Python + matplotlib | 生成架构图 | `pip install matplotlib numpy` |
| Node.js + docx | 文档生成 | `npm install docx` |

---

## 完整工作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    技术选型分析工作流                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. 候选技术  │    │  2. 信息检索  │    │  3. 多维度   │
│     识别      │───▶│   & 收集     │───▶│   分析对比   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  4. 架构图   │    │  5. Word    │    │  6. 知识库   │
│    生成      │───▶│   文档生成   │───▶│    上传      │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 6 个智能体角色

| 智能体 | 职责 | 输出 |
|--------|------|------|
| **候选技术识别员** | 识别候选技术项 | 技术清单（名称、官网、GitHub） |
| **信息检索员** | WebFetch/WebSearch 收集信息 | 技术资料包 |
| **多维度分析师** | 分析对比各维度 | 对比矩阵、评分表 |
| **架构师** | 生成架构图、流程图 | PNG 架构图 |
| **文档工程师** | 生成 Word 报告 | DOCX 文档 |
| **知识库管理员** | 上传到 IMA 知识库 | 上传确认 |

---

## 分析维度

### 基础维度（默认）

| 维度 | 权重 | 评估内容 |
|------|------|----------|
| **性能** | 25% | 执行效率、资源占用、吞吐量 |
| **易用性** | 20% | 安装便捷性、学习曲线、文档质量 |
| **生态** | 20% | 社区活跃度、插件生态、企业采用 |
| **维护** | 20% | 更新频率、Issue 响应、稳定性 |
| **成本** | 15% | 许可费用、运维成本、人力成本 |

### 扩展维度（可选）

- **安全性** - 漏洞历史、安全审计
- **扩展性** - 水平扩展、垂直扩展
- **兼容性** - 向后兼容、跨平台支持
- **可观测性** - 监控、日志、追踪支持

---

## 使用方式

### 1. 快速开始

```bash
# 执行完整工作流
bun run scripts/analyze.ts "技术选型主题" \
  --candidates "技术A,技术B,技术C" \
  --dimensions "performance,usability,ecosystem" \
  --output "分析报告.docx"
```

### 2. 分步执行

```bash
# Step 1: 识别候选技术
bun run scripts/identify-candidates.ts "消息队列技术选型"

# Step 2: 检索信息
bun run scripts/research.ts --candidate "Kafka" --candidate "RabbitMQ"

# Step 3: 多维度分析
bun run scripts/analyze.ts --data research-data.json

# Step 4: 生成架构图
bun run scripts/generate-diagram.ts --architecture "消息队列对比"

# Step 5: 生成 Word
bun run scripts/generate-docx.ts --analysis analysis.json --diagram diagram.png

# Step 6: 上传知识库
bun run scripts/upload-to-ima.ts --file "分析报告.docx" --kb "技术选型"
```

---

## 文件结构

```
tech-analysis-workflow/
├── SKILL.md                    # 本文件
├── README.md                   # 使用说明
├── config/
│   └── default-dimensions.json # 默认分析维度
├── scripts/
│   ├── identify-candidates.ts  # 候选技术识别
│   ├── research.ts             # 信息检索
│   ├── analyze.ts              # 多维度分析
│   ├── generate-diagram.ts     # 架构图生成
│   ├── generate-docx.ts        # Word 文档生成
│   └── upload-to-ima.ts        # 知识库上传
└── templates/
    ├── analysis-template.md    # 分析报告模板
    └── diagram-config.json     # 架构图配置
```

---

## 与 docx-generator 的集成

本 Skill 调用 docx-generator 生成专业 Word 文档：

```typescript
// 生成文档时调用 docx-generator
const result = execSync(
  `node ../docx-generator/scripts/create-report-docx.js "${analysisMd}" "${outputDocx}"`,
  { encoding: "utf-8" }
);
```

**集成点**：
1. 技术分析 Markdown 报告 → docx-generator → Word 文档
2. 架构图 PNG → docx-generator → 插入 Word
3. 支持目录、页眉页脚、专业排版

---

## 与 IMA 知识库的集成

```typescript
// 上传知识库
const result = execSync(
  `claude skill run ima:upload --file "${docxFile}" --kb "技术选型库"`,
  { encoding: "utf-8" }
);
```

---

## 输出示例

### Markdown 分析报告

```markdown
# Kafka vs RabbitMQ 技术选型分析

## 执行摘要
- 推荐方案：Kafka
- 综合评分：8.5/10 vs 7.2/10
- 适用场景：高吞吐消息队列

## 多维度对比

| 维度 | Kafka | RabbitMQ | 胜出 |
|------|-------|----------|------|
| 性能 | 9/10 | 7/10 | ✅ Kafka |
| 易用性 | 6/10 | 8/10 | ✅ RabbitMQ |
| 生态 | 9/10 | 8/10 | ✅ Kafka |

## 架构图
![消息队列架构对比](diagram.png)

## 结论与建议
...
```

### Word 文档

包含：
- 封面页（标题、日期、作者）
- 目录
- 执行摘要
- 详细分析章节
- 架构图（彩色）
- 评分对比表
- 结论与建议

---

## 配置

### 环境变量

```bash
# IMA 知识库配置
export IMA_CLIENT_ID="xxx"
export IMA_API_KEY="xxx"

# 可选：自定义维度权重
export ANALYSIS_DIMENSIONS="performance:30,usability:20,ecosystem:25,cost:25"
```

### 配置文件

```json
// config/default-dimensions.json
{
  "dimensions": [
    { "name": "性能", "weight": 0.25, "metrics": ["吞吐量", "延迟", "CPU/内存"] },
    { "name": "易用性", "weight": 0.20, "metrics": ["安装", "配置", "文档"] },
    { "name": "生态", "weight": 0.20, "metrics": ["社区", "插件", "案例"] },
    { "name": "维护", "weight": 0.20, "metrics": ["更新", "Bug", "支持"] },
    { "name": "成本", "weight": 0.15, "metrics": ["许可", "运维", "人力"] }
  ]
}
```

---

## 技术检索工具链

| 工具 | 用途 | 优先级 |
|------|------|--------|
| **WebFetch** | 获取官方文档、GitHub README | 首选 |
| **WebSearch** | 搜索对比文章、benchmark | 补充 |
| **Web-Access** | 访问特定技术网站 | 备选 |
| **GitHub API** | 获取 stars、commits、issues | 数据支撑 |

---

## 注意事项

1. **API 限制**：WebSearch/WebFetch 有调用频率限制
2. **信息时效**：技术信息可能过时，建议标注检索时间
3. **客观性**：分析尽量客观，标注信息来源
4. **版权**：架构图使用开源字体，避免版权问题
5. **敏感信息**：配置文件中不要提交 API Key

---

## 建议

这是一个**新的独立 Skill**，而非扩展现有 docx-generator，因为：

1. **关注点不同**：docx-generator 专注文档生成，本 Skill 专注技术选型流程
2. **复杂度**：本 Skill 包含 6 个智能体协作，workflow 更复杂
3. **可复用性**：独立 Skill 可被其他技术选型场景复用
4. **演进方向**：未来可扩展支持更多数据源（如 Gartner、DB-Engines）

---

## License

MIT
