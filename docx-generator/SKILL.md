# Markdown 转 DOCX Skill

将 Markdown 报告转换为专业排版的 DOCX 格式文档，支持架构图生成和插入。

## 功能特性

- ✅ Markdown 转 DOCX 专业排版
- ✅ 自动生成架构图（Python matplotlib）
- ✅ 图片自动插入 Word 文档
- ✅ 中文字体支持
- ✅ 目录自动生成
- ✅ 页眉页脚支持

## 安装

### 1. 克隆 Skill

```bash
cd ~/.claude/skills
git clone https://github.com/your-username/docx-generator-skill.git docx-generator
```

或直接创建目录：
```bash
mkdir -p ~/.claude/skills/docx-generator
```

### 2. 安装 Node.js 依赖

```bash
cd ~/.claude/skills/docx-generator
npm install docx
```

### 3. 安装 Python 依赖（可选，用于生成架构图）

```bash
pip install matplotlib numpy
```

### 4. 验证中文字体

Windows 通常自带 SimHei（黑体），无需额外安装。

Linux/Mac 用户需安装中文字体：
```bash
# Ubuntu/Debian
sudo apt-get install fonts-wqy-zenhei

# MacOS
brew install font-wqy-zenhei
```

## 使用方法

### 方法 1: 使用 Skill 命令

安装后在 Claude Code 中使用：

```bash
/skill docx-generator --input report.md --output report.docx
```

### 方法 2: 直接使用脚本

```bash
# 生成 DOCX（不含架构图）
node ~/.claude/skills/docx-generator/scripts/create-report-docx.js input.md output.docx

# 先生成架构图，再生成 DOCX
python ~/.claude/skills/docx-generator/scripts/generate_arch.py
node ~/.claude/skills/docx-generator/scripts/create-report-docx.js input.md output.docx
```

### 方法 3: 复制脚本到项目

```bash
cp ~/.claude/skills/docx-generator/scripts/*.js ./
cp ~/.claude/skills/docx-generator/scripts/*.py ./

# 修改脚本内容适配你的项目
# 运行
python generate_arch.py
node create-report-docx.js
```

## 快速开始

### 示例 1: 简单 Markdown 转 DOCX

```javascript
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        text: "报告标题",
        heading: "Heading1"
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "这是正文内容。", font: "SimHei" })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('output.docx', buffer);
});
```

### 示例 2: 生成架构图

```python
# diagrams/ragflow_arch.py
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
plt.rcParams['axes.unicode_minus'] = False

def create_arch():
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    # 绘制层
    layers = [
        ("输入层", ["查询", "上传"], 6.5, '#E3F2FD'),
        ("处理层", ["OCR", "分块", "Embedding"], 4.5, '#FFF3E0'),
        ("输出层", ["生成"], 2.5, '#E8F5E9'),
    ]
    
    for name, components, y, color in layers:
        rect = FancyBboxPatch((1, y-0.5), 10, 1.2,
                              boxstyle="round,pad=0.05",
                              facecolor=color, edgecolor='#333')
        ax.add_patch(rect)
        ax.text(1.5, y, name, fontsize=14, fontweight='bold', va='center')
        
        comp_width = 8 / len(components)
        for i, comp in enumerate(components):
            x = 3.5 + i * comp_width
            ax.text(x + comp_width/2, y, comp, fontsize=11, 
                   ha='center', va='center',
                   bbox=dict(boxstyle='round', facecolor='white', edgecolor='#666'))
    
    plt.savefig('architecture.png', dpi=200, bbox_inches='tight')
    plt.close()

create_arch()
```

### 示例 3: 完整报告生成（Markdown + 架构图）

```javascript
const { Document, Packer, Paragraph, TextRun, ImageRun, 
        HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

async function createReport() {
  // 读取架构图
  const imageBuffer = fs.readFileSync('diagrams/ragflow_arch.png');
  
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "SimHei" },
          paragraph: { spacing: { after: 200 } }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "SimHei" },
          paragraph: { spacing: { before: 200, after: 100 } }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // 标题
        new Paragraph({
          text: "AI记忆系统分析报告",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        
        // 章节标题
        new Paragraph({
          text: "1. 系统架构",
          heading: HeadingLevel.HEADING_2
        }),
        
        // 架构图
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              type: "png",
              transformation: { width: 550, height: 367 }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        
        // 正文
        new Paragraph({
          children: [
            new TextRun({ 
              text: "本系统采用分层架构设计，包括输入层、处理层和输出层...",
              font: "SimHei",
              size: 21
            })
          ]
        })
      ]
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('report.docx', buffer);
  console.log('报告生成成功: report.docx');
}

createReport();
```

## API 参考

### Document 配置

| 属性 | 类型 | 说明 |
|------|------|------|
| styles | object | 自定义样式（段落、字符） |
| sections | array | 文档章节 |
| properties | object | 页面设置（边距、大小） |

### 段落样式属性

| 属性 | 类型 | 示例 |
|------|------|------|
| spacing.before | number | 200（约0.2英寸） |
| spacing.after | number | 200 |
| alignment | enum | AlignmentType.CENTER |
| heading | enum | HeadingLevel.HEADING_1 |

### ImageRun 配置

```javascript
new ImageRun({
  data: fs.readFileSync('image.png'),
  type: "png",  // 或 "jpg"
  transformation: {
    width: 550,   // 像素
    height: 367   // 像素
  }
})
```

## 目录结构

```
~/.claude/skills/docx-generator/
├── SKILL.md                      # 本文件
├── package.json                  # 依赖配置
├── scripts/
│   ├── create-report-docx.js    # DOCX 生成脚本模板
│   ├── generate_arch.py         # 架构图生成脚本
│   └── example/                  # 示例文件
│       ├── sample-report.md
│       └── sample-output.docx
└── diagrams/                     # 生成的架构图目录
```

## 常见问题

### Q: 中文显示为方块？
**A**: 确保设置了中文字体：
```javascript
new TextRun({ text: "中文", font: "SimHei" })
```

### Q: 架构图中文乱码？
**A**: Python 脚本开头添加：
```python
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
plt.rcParams['axes.unicode_minus'] = False
```

### Q: 图片插入后太小？
**A**: 调整 transformation 尺寸：
```javascript
transformation: { width: 550, height: 367 }  // 增大数值
```

### Q: 文档空白太多？
**A**: 减少 spacing 值并去掉 pageBreakBefore：
```javascript
spacing: { before: 100, after: 100 }  // 默认 200
```

### Q: 如何批量生成多个架构图？
**A**: 在 generate_arch.py 中定义多个 layers 配置，循环生成：
```python
systems = [
    ("RAGFlow", ragflow_layers, "ragflow_arch.png"),
    ("MemPalace", mempalace_layers, "mempalace_arch.png"),
]
for name, layers, output in systems:
    create_architecture_diagram(name, layers, output)
```

## 进阶技巧

### 1. 表格生成

```javascript
const { Table, TableCell, TableRow, WidthType } = require('docx');

new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("表头1")] }),
        new TableCell({ children: [new Paragraph("表头2")] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("数据1")] }),
        new TableCell({ children: [new Paragraph("数据2")] }),
      ]
    })
  ],
  width: { size: 100, type: WidthType.PERCENTAGE }
})
```

### 2. 页眉页脚

```javascript
const { Header, Footer, PageNumber } = require('docx');

sections: [{
  headers: {
    default: new Header({
      children: [new Paragraph("报告标题")]
    })
  },
  footers: {
    default: new Footer({
      children: [new Paragraph("第 " + PageNumber.CURRENT + " 页")]
    })
  },
  children: [/* ... */]
}]
```

### 3. 自定义样式

```javascript
styles: {
  paragraphStyles: [
    {
      id: "CustomStyle",
      name: "Custom Style",
      run: { color: "FF0000", bold: true },
      paragraph: { spacing: { line: 360 } }  // 1.5倍行距
    }
  ]
}
```

## 版本历史

- **v1.0.0** (2026-04-08)
  - 初始版本
  - 支持 Markdown 转 DOCX
  - 支持架构图生成和插入
  - 中文字体支持

## 相关链接

- [docx-js 官方文档](https://docx.js.org/)
- [matplotlib 文档](https://matplotlib.org/)
- [Claude Code Skills 开发指南](https://github.com/anthropics/skills)

## 许可证

MIT License
