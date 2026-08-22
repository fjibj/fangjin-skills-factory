# -*- coding: utf-8 -*-
"""数据素材生成骨架：为演示页造"真实感"数据资产。
原则：能用真实来源(免费图库照片+做旧)的不用纯程序画；非照片类可程序化生成。
各函数真实实现参考既有项目; 这里给出分类与做旧要点。
"""
import os

# 输出目录(演示系统引用的数据目录)
OUT = os.path.join(os.path.dirname(__file__), "..", "demo", "assets", "data")


def gen_photos_real():
    """照片类: 下载免费图库真实照片(如 Pixabay 可商用免署名)。
    - 类别语义要准(演示'车辆'就是目标对象, 不是泛义)
    - 下载后做旧成"系统采集/监控"质感: 时间戳 + 机位号 + 噪点 + JPEG q=62 + 暗角
    - 产物存 demo/assets/data/images/ 供页面引用
    """
    pass


def gen_timeseries():
    """时序类: 程序化生成曲线PNG(振动/温度/风/功率), 配真实坐标轴"""
    pass


def gen_audio():
    """音频类: 合成音频 + 波形/频谱图"""
    pass


def gen_video():
    """视频类: 生成短巡检/演示视频(帧序列→mp4)"""
    pass


def gen_text():
    """文本类: 语料/QA/样本文本(json/txt)"""
    pass


def gen_multimodal():
    """多模态: 图文对 + 对应关系json"""
    pass


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    gen_photos_real(); gen_timeseries(); gen_audio(); gen_video(); gen_text(); gen_multimodal()
