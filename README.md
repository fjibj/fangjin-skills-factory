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

### 4. ima-upload

IMA 知识库文件上传 Skill - 完整的文件上传工作流，支持多种文件类型。

**功能特性：**
- ✅ 文件预检验证（类型、大小检查）
- ✅ 重复文件名检测
- ✅ 自动获取 COS 临时凭证
- ✅ 分块上传到腾讯云 COS
- ✅ 自动添加到知识库
- ✅ 上传结果验证

**支持的文件类型：**
- PDF (.pdf)
- Word (.doc/.docx)
- PowerPoint (.ppt/.pptx)
- Excel (.xls/.xlsx/.csv)
- Markdown (.md)
- 图片 (.png/.jpg/.jpeg/.webp)
- 文本 (.txt)
- 音频 (.mp3/.m4a/.wav/.aac)

**快速开始：**
```bash
# 使用 hermes-skill 调用
/hermes-skill ima-upload
# 或直接使用 skill
/ima-upload
```

**详细文档：** [SKILL.md](ima-upload/SKILL.md)

---

### 5. software-uninstall

Windows 软件干净卸载 Skill - 多方法彻底卸载，清理残留。

**功能特性：**
- ✅ Settings App 卸载（现代应用）
- ✅ Control Panel 卸载（传统应用）
- ✅ PowerShell Get-Package 自动化卸载
- ✅ Geek Uninstaller 深度清理
- ✅ 手动注册表清理
- ✅ 残留文件自动清理
- ✅ 卸载结果验证

**支持场景：**
- 普通软件卸载
- 顽固软件强制移除
- 残留文件清理
- 注册表清理

**快速开始：**
```bash
# PowerShell 示例
Get-Package | Where-Object {$_.Name -like "*Software*"} | Uninstall-Package -Force
```

**详细文档：** [SKILL.md](software-uninstall/SKILL.md)

---

### 6. harness-workflow

微信消息 Harness 流程处理 Skill - Plan → Work → Review → Reply 四阶段工作流。

**功能特性：**
- ✅ Phase 1: Plan（创建计划）
- ✅ Phase 2: Work（执行计划）
- ✅ Phase 3: Review（审查结果）
- ✅ Phase 4: Reply（发送回复）
- ✅ 每阶段结果实时返回微信
- ✅ 自动进度报告
- ✅ 消息处理记忆记录

**适用场景：**
- 微信消息自动化处理
- 多步骤任务执行
- 需要用户可见进度的任务

**快速开始：**
```bash
# 检测新消息
cd ~/.claude/plugins/cache/cc-weixin/weixin/0.1.0
bun run auto-process.ts

# 按 Harness 流程处理
# Phase 1: Plan → Phase 2: Work → Phase 3: Review → Phase 4: Reply
```

**详细文档：** [SKILL.md](harness-workflow/SKILL.md)

---

### 7. github-research

GitHub 仓库研究分析 Skill - 系统化分析开源项目。

**功能特性：**
- ✅ 克隆或访问仓库
- ✅ 代码结构探索
- ✅ 依赖关系分析
- ✅ 代码模式搜索
- ✅ 近期活动分析
- ✅ 多深度分析（Quick/Standard/Deep）

**分析维度：**
- 项目概述和用途
- 架构和模块划分
- 核心依赖和技术栈
- 代码质量和测试
- 维护状态和社区活跃度

**快速开始：**
```bash
# 快速分析
git clone <repo_url> /tmp/repo-analysis/<name>
cd /tmp/repo-analysis/<name>
ls -la && cat README.md | head -50

# 深度分析
# 按 SKILL.md 8步流程执行
```

**详细文档：** [SKILL.md](github-research/SKILL.md)

---

### 8. github-fix

GitHub 问题修复 Skill - 诊断和修复 CI、测试、构建问题。

**功能特性：**
- ✅ CI 失败诊断
- ✅ 测试失败修复
- ✅ 构建错误修复
- ✅ Lint 错误修复
- ✅ Workflow 配置修复
- ✅ 4阶段修复流程（Diagnose → Fix → Verify → Document）

**支持问题类型：**
- CI/CD 失败
- 测试失败
- 构建错误
- 依赖问题
- Workflow 配置错误
- 超时问题

**快速开始：**
```bash
# 诊断 CI 失败
gh run list --status failure --limit 1
gh run view <run-id> --log

# 本地复现和修复
npm test
# 修复代码...
npm test  # 验证

# 提交修复
git commit -m "fix: [修复描述]"
git push
```

**详细文档：** [SKILL.md](github-fix/SKILL.md)

---

### 9. claude-mem-config

Claude 记忆系统配置 Skill - 管理和配置 Claude Code 的持久化记忆。

**功能特性：**
- ✅ 4 种记忆类型管理（User/Feedback/Project/Reference）
- ✅ 记忆文件创建规范
- ✅ MEMORY.md 索引维护
- ✅ 记忆更新和过期处理
- ✅ 记忆分类和检索

**记忆类型：**
- **User**: 用户角色、背景、偏好
- **Feedback**: 工作方式指导（做/不做）
- **Project**: 进行中的工作、决策、限制
- **Reference**: 外部系统指针

**快速开始：**
```bash
# 创建记忆文件
# ~/.claude/memory/{type}/{name}.md

# 更新索引
# ~/.claude/memory/MEMORY.md
```

**详细文档：** [SKILL.md](claude-mem-config/SKILL.md)

---

更多 skills 持续添加中...
