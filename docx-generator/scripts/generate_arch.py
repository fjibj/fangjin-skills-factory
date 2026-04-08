#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
架构图生成脚本
使用方法: python generate_arch.py
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import os

# 设置中文字体（关键！避免中文显示为方块）
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'SimSun', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 颜色配置
COLORS = {
    'input': '#BBDEFB',      # 浅蓝
    'process': '#FFE0B2',    # 浅橙
    'storage': '#C8E6C9',    # 浅绿
    'retrieval': '#F8BBD9',  # 浅粉
    'output': '#E1BEE7',     # 浅紫
    'border': '#333333',
    'component_border': '#555555',
    'arrow': '#1976D2'
}


def create_architecture_diagram(system_name, layers, output_file, options=None):
    """
    创建专业架构图

    参数:
        system_name: 系统名称（显示在标题）
        layers: [(层名称, [组件1, 组件2, ...]), ...]
        output_file: 输出文件路径
        options: 可选配置
            - figsize: 画布大小 (默认 (16, 12))
            - dpi: 分辨率 (默认 200)
            - layer_height: 层高度 (默认 1.6)
            - box_width: 层宽度 (默认 14.0)
    """
    opts = options or {}
    figsize = opts.get('figsize', (16, 12))
    dpi = opts.get('dpi', 200)
    layer_height = opts.get('layer_height', 1.6)
    box_width = opts.get('box_width', 14.0)

    fig, ax = plt.subplots(1, 1, figsize=figsize)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')

    color_list = [COLORS['input'], COLORS['process'], COLORS['storage'],
                  COLORS['retrieval'], COLORS['output']]

    # 标题
    ax.text(8, 11.2, system_name, fontsize=24, fontweight='bold',
            ha='center', va='center')

    start_y = 9.0
    box_start_x = (16 - box_width) / 2  # 居中

    for i, (layer_name, components) in enumerate(layers):
        y = start_y - i * 2.0
        color = color_list[i % len(color_list)]

        # 层背景
        rect = FancyBboxPatch((box_start_x, y - layer_height/2), box_width, layer_height,
                              boxstyle="round,pad=0.08",
                              facecolor=color, edgecolor=COLORS['border'], linewidth=2.5)
        ax.add_patch(rect)

        # 层标签
        ax.text(box_start_x + 0.8, y, layer_name, fontsize=16, fontweight='bold',
                va='center', ha='left')

        # 组件
        comp_start = box_start_x + 3.0
        comp_available_width = box_width - 3.5
        comp_width = comp_available_width / len(components)

        for j, comp in enumerate(components):
            x = comp_start + j * comp_width + comp_width/2
            comp_rect = FancyBboxPatch((comp_start + j * comp_width, y - 0.5),
                                       comp_width - 0.3, 1.0,
                                       boxstyle="round,pad=0.03",
                                       facecolor='white',
                                       edgecolor=COLORS['component_border'],
                                       linewidth=1.5)
            ax.add_patch(comp_rect)
            ax.text(x, y, comp, fontsize=11, va='center', ha='center')

    # 层间箭头
    for i in range(len(layers) - 1):
        y1 = start_y - i * 2.0 - layer_height/2
        y2 = start_y - (i + 1) * 2.0 + layer_height/2
        ax.annotate('', xy=(8, y2), xytext=(8, y1),
                   arrowprops=dict(arrowstyle='->', lw=2.5, color=COLORS['arrow']))

    plt.tight_layout()

    # 确保输出目录存在
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    plt.savefig(output_file, dpi=dpi, bbox_inches='tight',
                facecolor='white', edgecolor='none', pad_inches=0.3)
    plt.close()
    print(f"✅ 生成架构图: {output_file}")


def main():
    """生成示例架构图"""

    # 定义输出目录
    output_dir = "./diagrams"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 1. RAGFlow 架构
    ragflow_layers = [
        ("输入层", ["用户查询", "文档上传"]),
        ("处理层", ["OCR引擎", "文档分块", "Embedding"]),
        ("存储层", ["向量数据库", "GraphRAG"]),
        ("检索层", ["向量检索", "关键词检索", "图遍历"]),
        ("输出层", ["Agent编排", "LLM API", "生成回答"])
    ]
    create_architecture_diagram("RAGFlow 系统架构", ragflow_layers,
                                f"{output_dir}/ragflow_arch.png")

    # 2. qmd 架构
    qmd_layers = [
        ("输入层", ["CLI命令", "文件路径"]),
        ("索引层", ["文件扫描", "倒排索引"]),
        ("存储层", ["本地索引", "配置文件"]),
        ("检索层", ["全文检索", "模糊匹配"]),
        ("输出层", ["终端显示", "格式化"])
    ]
    create_architecture_diagram("qmd 系统架构", qmd_layers,
                                f"{output_dir}/qmd_arch.png")

    # 3. MemPalace 架构
    mempalace_layers = [
        ("输入层", ["对话历史", "上下文信息"]),
        ("压缩层", ["AAAK压缩算法", "记忆编码"]),
        ("存储层", ["记忆数据库", "元数据索引"]),
        ("检索层", ["记忆解码", "相似度匹配"]),
        ("输出层", ["上下文注入", "记忆增强"])
    ]
    create_architecture_diagram("MemPalace 系统架构", mempalace_layers,
                                f"{output_dir}/mempalace_arch.png")

    # 4. MemOS 架构
    memos_layers = [
        ("应用层", ["MoltBot", "ClawdBot", "OpenClaw"]),
        ("技能层", ["Skill Manager", "技能库"]),
        ("记忆层", ["情景记忆", "语义记忆"]),
        ("存储层", ["Vector DB", "Graph DB"]),
        ("接口层", ["OpenAI API", "LangChain"])
    ]
    create_architecture_diagram("MemOS 系统架构", memos_layers,
                                f"{output_dir}/memos_arch.png")

    # 5. M-FLOW 架构
    mflow_layers = [
        ("输入层", ["自然语言", "结构化数据"]),
        ("图谱层", ["Cone Graph", "实体抽取"]),
        ("记忆层", ["MemFlow", "时序记忆"]),
        ("推理层", ["多跳推理", "图遍历"]),
        ("输出层", ["答案生成", "路径展示"])
    ]
    create_architecture_diagram("M-FLOW 系统架构", mflow_layers,
                                f"{output_dir}/mflow_arch.png")

    print(f"\n🎉 所有架构图生成完成！保存在 {output_dir}/ 目录")


if __name__ == "__main__":
    main()
