# wechat-article-workflow

微信公众号文章创作 Skill for Claude Code

## 依赖说明

**本 Skill 是独立完整的，不需要额外安装其他 Skill。**

wechat-article-workflow 已经整合了以下旧版本 Skill 的功能：
- ✅ **文章生成** - 原 wechat-article-generate（已整合）
- ✅ **文章导出** - 原 wechat-article-export（已整合）
- ✅ **MaydayV 风格** - 原 wechat-article-maydayv（已整合到风格学习）

**系统要求：**
- Node.js 20+
- bun
- Python 3.8+
- PIL (Pillow)
- requests

---

## 快速开始

### 安装

```bash
# 复制到 skills 目录
cp -r wechat-article-workflow ~/.claude/skills/

# 安装依赖
cd ~/.claude/skills/wechat-article-workflow
npm install
pip install pillow requests
```

### 配置

1. 复制配置模板：
```bash
cp wechat-article.config.json.example wechat-article.config.json
```

2. 编辑配置文件，填入你的公众号信息：
```json
{
  "appid": "wx_xxxx",
  "appsecret": "xxxx",
  "author": "作者名",
  "account_name": "公众号名称",
  "slogan": "公众号 Slogan"
}
```

### 使用

**方式 1：基于主题生成**
```bash
bun run scripts/generate.ts "AI编程新趋势"
```

**方式 2：基于风格学习**
```bash
bun run scripts/learn-style.ts https://mp.weixin.qq.com/s/xxxxx
```

**生成封面**
```bash
bun run scripts/create-cover.ts --title "文章标题" --style A1 --color blue
```

**上传草稿箱**
```bash
bun run scripts/publish-draft.ts --article article.html --cover cover.png
```

---

## 完整流程示例

```bash
# 1. 生成文章
cd ~/.claude/skills/wechat-article-workflow
bun run scripts/generate.ts "AI技能化营销案例分析"

# 2. 生成封面
bun run scripts/create-cover.ts --title "AI技能化营销案例分析" --style A2 --color purple

# 3. 验证格式
bun run scripts/validate-article.ts output/article.html

# 4. 上传草稿箱
bun run scripts/publish-draft.ts --article output/article.html --cover output/cover.png
```

---

## 评分标准

文章生成后会经过 6 个智能体评分：

| 维度 | 权重 | 优秀标准 |
|------|------|----------|
| 深度 | 30% | 有数据支撑，观点独到 |
| 网感 | 30% | 语言有趣，引发共鸣 |
| 结构 | 20% | 逻辑清晰，节奏流畅 |
| 原创 | 20% | 观点新颖，有个人风格 |

**发布建议**: 总分 ≥ 9 分推荐发布，≥ 8.5 分可发布

---

## 封面风格

### 风格选项

- `A1` - 极简网格（简约大气）
- `A2` - 编辑卡片（专业编辑风）
- `A3` - 斜切动势（动感活力）
- `A4` - 柔和渐变（温暖亲和）

### 配色选项

- `blue` - 科技蓝
- `purple` - 洞察紫
- `green` - 增长绿
- `orange` - 活力橙
- `rose` - 故事玫红
- `gray` - 专业灰

## 隐私说明

⚠️ **重要**: `wechat-article.config.json` 包含敏感信息（appid/appsecret），请：
- 不要提交到 GitHub
- 添加到 `.gitignore`
- 仅本地保存

---

## License

MIT
