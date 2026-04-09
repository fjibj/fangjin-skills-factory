# fangjin-skills-factory

the skills created by fangjin （is Me)

## Skills 列表

### 1. docx-generator

Markdown 转 DOCX Skill for Claude Code - 支持架构图生成和插入。

**功能特性：**
- ✅ Markdown 转 DOCX 专业排版
- ✅ 自动生成架构图（Python matplotlib）
- ✅ 图片自动插入 Word 文档
- ✅ 中文字体支持（SimHei）
- ✅ 目录自动生成
- ✅ 页眉页脚支持

**快速开始：**
```bash
cd docx-generator
npm install
cd scripts/example
python ../generate_arch.py
node ../create-report-docx.js sample-report.md output.docx
```

**详细文档：** [SKILL.md](docx-generator/SKILL.md)

---

### 2. wechat-article-workflow

微信公众号文章创作全流程 Skill - 从主题到草稿箱的完整工作流。

**功能特性：**
- ✅ 多智能体协作文章生成（6 个智能体工作流）
- ✅ 写作风格 DNA 分析与学习
- ✅ 封面图自动生成（4 种风格 × 6 种配色）
- ✅ 文章格式验证与排版
- ✅ 一键上传到公众号草稿箱

**6 智能体工作流：**
1. 时事研究员 - 收集素材
2. 深度思考者 - 撰写草稿
3. Meme大师 - 注入网感
4. 铁面主编 - 融合定稿
5. 中控裁判 - 质量评分（深度/网感/结构/原创）
6. 文章渲染器 - HTML输出

**快速开始：**
```bash
cd wechat-article-workflow
cp wechat-article.config.json.example wechat-article.config.json
# 编辑配置文件填入公众号信息
bun run scripts/generate.ts "AI技术趋势"
```

**详细文档：** [SKILL.md](wechat-article-workflow/SKILL.md)

---

### 3. tech-analysis-workflow

技术选型分析全流程 Skill - 从候选技术检索到知识库上传的完整工作流。

**功能特性：**
- ✅ 候选技术自动识别与检索
- ✅ 多维度分析对比（性能/易用性/生态/维护/成本）
- ✅ 自动生成架构图（Python matplotlib）
- ✅ Markdown 转 DOCX 专业报告
- ✅ 一键上传到 IMA 知识库

**6 智能体工作流：**
1. 候选技术识别员 - 识别候选技术
2. 信息检索员 - WebFetch/WebSearch 收集信息
3. 多维度分析师 - 分析对比各维度
4. 架构师 - 生成架构图、流程图
5. 文档工程师 - 生成 Word 报告
6. 知识库管理员 - 上传到 IMA 知识库

**快速开始：**
```bash
cd tech-analysis-workflow
bun run scripts/analyze.ts "技术选型主题" \
  --candidates "技术A,技术B,技术C" \
  --dimensions "performance,usability,ecosystem"
```

**详细文档：** [SKILL.md](tech-analysis-workflow/SKILL.md)

---

更多 skills 持续添加中...
