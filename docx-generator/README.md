# docx-generator Skill 安装说明

## 快速安装

### 步骤 1: 复制 Skill 到 Claude Code 目录

```bash
# 创建 skills 目录（如果不存在）
mkdir -p ~/.claude/skills

# 复制 docx-generator skill
cp -r D:/claudecode/MyAICodes/just-for-weixin/skills/docx-generator ~/.claude/skills/
```

### 步骤 2: 安装 Node.js 依赖

```bash
cd ~/.claude/skills/docx-generator
npm install
```

### 步骤 3: 安装 Python 依赖（可选，用于生成架构图）

```bash
pip install matplotlib numpy
```

### 步骤 4: 验证安装

```bash
# 生成示例架构图
python ~/.claude/skills/docx-generator/scripts/generate_arch.py

# 生成示例 DOCX
node ~/.claude/skills/docx-generator/scripts/create-report-docx.js \
  ~/.claude/skills/docx-generator/scripts/example/sample-report.md \
  test-output.docx
```

## 使用方式

### 方式 1: 直接使用脚本

```bash
# 生成架构图
python ~/.claude/skills/docx-generator/scripts/generate_arch.py

# Markdown 转 DOCX
node ~/.claude/skills/docx-generator/scripts/create-report-docx.js input.md output.docx
```

### 方式 2: 使用 npm scripts

```bash
cd ~/.claude/skills/docx-generator

# 生成架构图
npm run generate-arch

# 生成 DOCX（需要先创建 input.md）
npm run generate-docx -- input.md output.docx
```

### 方式 3: 复制到项目使用

```bash
# 复制脚本到当前项目
cp ~/.claude/skills/docx-generator/scripts/create-report-docx.js ./
cp ~/.claude/skills/docx-generator/scripts/generate_arch.py ./

# 修改脚本内容适配项目
# 运行
python generate_arch.py
node create-report-docx.js report.md report.docx
```

## 文件结构

```
~/.claude/skills/docx-generator/
├── SKILL.md                      # 完整文档
├── package.json                  # 依赖配置
├── README.md                     # 本文件
├── scripts/
│   ├── create-report-docx.js    # DOCX 生成脚本
│   ├── generate_arch.py         # 架构图生成脚本
│   └── example/
│       └── sample-report.md     # 示例 Markdown
└── diagrams/                     # 生成的架构图（运行时创建）
```

## 故障排除

### 中文显示为方块

**问题**: Word 中中文显示为方块

**解决**: 确保在 TextRun 中设置中文字体：
```javascript
new TextRun({ text: "中文", font: "SimHei" })
```

### 架构图中文乱码

**问题**: 生成的架构图中文显示为方块

**解决**: 检查 Python 脚本中的字体设置：
```python
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
```

Windows 通常自带 SimHei，Linux/Mac 可能需要安装：
```bash
# Ubuntu
sudo apt-get install fonts-wqy-zenhei

# Mac
brew install font-wqy-zenhei
```

### 找不到 docx 模块

**问题**: Error: Cannot find module 'docx'

**解决**: 在 skill 目录运行 npm install：
```bash
cd ~/.claude/skills/docx-generator
npm install docx
```

### 图片插入失败

**问题**: 图片未显示或显示错误

**解决**: 检查图片路径是否正确，支持相对路径和绝对路径：
```markdown
![描述](diagrams/arch.png)          # 相对路径
![描述](/absolute/path/arch.png)   # 绝对路径
```

## 卸载

```bash
rm -rf ~/.claude/skills/docx-generator
```

## 更新

```bash
cd ~/.claude/skills/docx-generator
git pull  # 如果使用 git
# 或重新复制新版本
cp -r /new/path/docx-generator/* .
```

## 许可证

MIT License
