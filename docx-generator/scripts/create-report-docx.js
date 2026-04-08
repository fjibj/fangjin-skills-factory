/**
 * Markdown 转 DOCX 生成脚本
 * 使用方法: node create-report-docx.js <input.md> [output.docx]
 */

const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableCell, TableRow,
        Header, Footer, AlignmentType, HeadingLevel, PageNumber, WidthType } = require('docx');
const fs = require('fs');
const path = require('path');

// 默认配置
const CONFIG = {
  font: "SimHei",  // 中文字体
  defaultWidth: 550,   // 默认图片宽度
  defaultHeight: 367,  // 默认图片高度
  outputDir: "./output"
};

/**
 * 解析 Markdown 内容
 * 简单实现：按行解析标题、段落、图片引用
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const elements = [];
  let currentParagraph = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 图片引用 ![alt](path)
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      // 先保存当前段落
      if (currentParagraph.length > 0) {
        elements.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      elements.push({ type: 'image', alt: imageMatch[1], path: imageMatch[2] });
      continue;
    }

    // 标题
    if (trimmed.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        elements.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      elements.push({ type: 'heading1', text: trimmed.substring(2) });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        elements.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      elements.push({ type: 'heading2', text: trimmed.substring(3) });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        elements.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      elements.push({ type: 'heading3', text: trimmed.substring(4) });
      continue;
    }

    // 空行表示段落结束
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        elements.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      continue;
    }

    // 普通文本
    currentParagraph.push(trimmed);
  }

  // 处理最后一段
  if (currentParagraph.length > 0) {
    elements.push({ type: 'paragraph', text: currentParagraph.join(' ') });
  }

  return elements;
}

/**
 * 创建 DOCX 文档
 */
async function createDocx(elements, outputPath, options = {}) {
  const children = [];

  for (const elem of elements) {
    switch (elem.type) {
      case 'heading1':
        children.push(new Paragraph({
          text: elem.text,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }));
        break;

      case 'heading2':
        children.push(new Paragraph({
          text: elem.text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }));
        break;

      case 'heading3':
        children.push(new Paragraph({
          text: elem.text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 80 }
        }));
        break;

      case 'paragraph':
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: elem.text,
              font: CONFIG.font,
              size: 21  // 10.5pt
            })
          ],
          spacing: { after: 100 },
          indent: { firstLine: 420 }  // 首行缩进
        }));
        break;

      case 'image':
        try {
          const imagePath = path.resolve(elem.path);
          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            const ext = path.extname(imagePath).toLowerCase();
            const imageType = ext === '.jpg' || ext === '.jpeg' ? 'jpg' : 'png';

            children.push(new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  type: imageType,
                  transformation: {
                    width: options.imageWidth || CONFIG.defaultWidth,
                    height: options.imageHeight || CONFIG.defaultHeight
                  }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 }
            }));

            // 图片标题
            if (elem.alt) {
              children.push(new Paragraph({
                children: [
                  new TextRun({
                    text: `图: ${elem.alt}`,
                    font: CONFIG.font,
                    size: 18,
                    italics: true
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              }));
            }
          } else {
            console.warn(`警告: 图片不存在 ${imagePath}`);
            children.push(new Paragraph({
              children: [
                new TextRun({
                  text: `[图片: ${elem.alt || elem.path}]`,
                  font: CONFIG.font,
                  color: 'FF0000'
                })
              ]
            }));
          }
        } catch (err) {
          console.error(`插入图片失败: ${err.message}`);
        }
        break;
    }
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: CONFIG.font },
          paragraph: { spacing: { after: 200 } }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: CONFIG.font },
          paragraph: { spacing: { before: 200, after: 100 } }
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: CONFIG.font },
          paragraph: { spacing: { before: 150, after: 80 } }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },  // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: options.headerText || "", font: CONFIG.font, size: 18 })
            ],
            alignment: AlignmentType.CENTER
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "第 ", font: CONFIG.font, size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], font: CONFIG.font, size: 18 }),
              new TextRun({ text: " 页", font: CONFIG.font, size: 18 })
            ],
            alignment: AlignmentType.CENTER
          })]
        })
      },
      children: children
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ DOCX 生成成功: ${outputPath}`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('用法: node create-report-docx.js <input.md> [output.docx] [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --header="标题"    设置页眉文字');
    console.log('  --width=600        设置图片宽度');
    console.log('  --height=400       设置图片高度');
    console.log('');
    console.log('示例:');
    console.log('  node create-report-docx.js report.md report.docx');
    console.log('  node create-report-docx.js report.md report.docx --header="AI报告" --width=550');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.md$/, '.docx');

  // 解析选项
  const options = {};
  for (const arg of args) {
    if (arg.startsWith('--header=')) {
      options.headerText = arg.substring(9).replace(/^"|"$/g, '');
    }
    if (arg.startsWith('--width=')) {
      options.imageWidth = parseInt(arg.substring(8));
    }
    if (arg.startsWith('--height=')) {
      options.imageHeight = parseInt(arg.substring(9));
    }
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 错误: 输入文件不存在 ${inputFile}`);
    process.exit(1);
  }

  console.log(`📄 读取 Markdown: ${inputFile}`);
  const content = fs.readFileSync(inputFile, 'utf-8');

  console.log('🔍 解析内容...');
  const elements = parseMarkdown(content);
  console.log(`   发现 ${elements.length} 个元素`);

  console.log('📝 生成 DOCX...');
  await createDocx(elements, outputFile, options);
}

// 运行
main().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
