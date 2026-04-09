# wechat-article-workflow Skill

微信公众号文章创作全流程 Skill，从主题到草稿箱的完整工作流。

---

## 功能特性

- ✅ 多智能体协作文章生成（6 个智能体工作流）
- ✅ 写作风格 DNA 分析与学习
- ✅ 封面图自动生成（4 种风格 × 6 种配色）
- ✅ 文章格式验证与排版
- ✅ 一键上传到公众号草稿箱

---

## 工作流程

```
用户选题 → ①时事研究员 → ②深度思考者 → ③Meme 大师 → ④铁面主编 → ⑤中控裁判
              ↓
         评分 ≥ 7.5? 
              ↓
     是 → ⑥文章渲染器 → HTML 输出 → 上传草稿箱
     否 → 返回修改 (最多 3 轮)
```

### 6 个智能体角色

| 智能体 | 职责 | 输出 |
|--------|------|------|
| **时事研究员** | 搜索最新资讯 | 素材包 + 数据支撑 |
| **深度思考者** | 撰写深度草稿 | 逻辑严谨的初稿 |
| **Meme 大师** | 注入网感 + 表情包 | 趣味化改写 |
| **铁面主编** | 融合定稿 + 图文对齐 | 发布级文章 |
| **中控裁判** | 多维度评分 | 深度/网感/结构/原创 四维评分 |
| **文章渲染器** | HTML 输出 | 公众号格式 HTML |

### 评分体系

| 维度 | 权重 | 说明 |
|------|------|------|
| 深度 (Depth) | 30% | 逻辑结构、数据支撑、独到见解 |
| 网感 (Virality) | 30% | 语言趣味、情感共鸣、表情包适配 |
| 结构 (Structure) | 20% | 段落划分、图文位置、节奏流畅 |
| 原创 (Originality) | 20% | 观点新颖、个人风格 |

**总分 = 深度×0.3 + 网感×0.3 + 结构×0.2 + 原创×0.2**

**发布标准**:
- 推荐发布：≥ 9 分
- 最低发布：≥ 8.5 分
- 低于 8.5 分需修改

---

## 封面生成

### 4 种设计风格

- **A1 极简网格** (minimal-grid) - 简约大气
- **A2 编辑卡片** (card-editorial) - 专业编辑风
- **A3 斜切动势** (diagonal-motion) - 动感活力
- **A4 柔和渐变** (soft-gradient) - 温暖亲和

### 6 种配色方案

- 科技蓝
- 洞察紫
- 增长绿
- 活力橙
- 故事玫红
- 专业灰

---

## 使用方式

### 1. 配置公众号信息

创建 `wechat-article.config.json`：

```json
{
  "appid": "你的公众号 AppID",
  "appsecret": "你的公众号 AppSecret",
  "author": "作者名",
  "account_name": "公众号名称",
  "slogan": "公众号 Slogan"
}
```

### 2. 文章创作

```bash
# 基于主题生成文章
bun run skills/wechat-article-workflow/scripts/generate.ts "AI编程新趋势"

# 或基于参考文章学习风格
bun run skills/wechat-article-workflow/scripts/learn-style.ts [参考文章URL]
```

### 3. 生成封面

```bash
bun run skills/wechat-article-workflow/scripts/create-cover.ts \
  --title "文章标题" \
  --style A1 \
  --color blue
```

### 4. 上传草稿箱

```bash
bun run skills/wechat-article-workflow/scripts/publish-draft.ts \
  --article output.html \
  --cover cover.png
```

---

## 文件结构

```
wechat-article-workflow/
├── SKILL.md                    # 本文件
├── README.md                   # 使用说明
├── wechat-article.config.json  # 配置文件（需自行创建）
└── scripts/
    ├── generate.ts             # 文章生成主入口
    ├── learn-style.ts          # 风格学习
    ├── create-cover.ts         # 封面生成
    ├── validate-article.ts     # 文章验证
    └── publish-draft.ts        # 上传草稿箱
```

---

## 依赖安装

```bash
# Node.js 依赖
npm install

# Python 依赖（封面生成）
pip install pillow requests
```

---

## 注意事项

1. **隐私保护**: 不要将 `wechat-article.config.json` 提交到 GitHub
2. **Access Token**: 有效期 2 小时，脚本会自动刷新
3. **封面图**: 建议尺寸 900×383px，格式 jpg/png
4. **文章长度**: 建议 800-2000 字，过长需分篇

---

## 许可证

MIT License
