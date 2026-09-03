# -*- coding: utf-8 -*-
"""合成器骨架：把"帧 + 旁白 + 字幕 + 鼠标"合成为一条功能成片。
机制：PLAN 字典驱动 —— 每条成片 = 一组镜头，每镜头 = (图片, 时长或旁白锚点, 字幕, 鼠标可无)。
真实实现可参考既有项目的 make_video.py(帧→视频+字幕) + mux_any.py(通用合成器)。
骨架给出结构与关键决策点；以下用占位移除业务细节。
"""
import os, json

ROOT = os.path.dirname(os.path.abspath(__file__))
WORDS = os.path.join(ROOT, "out", "clips", "words.json")   # TTS 输出的每句时长
FRAMES = os.path.join(ROOT, "out", "frames")
FINAL = os.path.join(ROOT, "out", "final")

# 每个功能一条 plan。字段示例:
#   img     —— 帧文件名(相对 FRAMES/<func>)
#   anchor  —— 该镜头用的旁白句 idx (词句给时长)
#   weight  —— 用于在同一旁白句下多镜头瓜分时长的权重
#   text    —— 若要每镜头自带字幕文本可覆盖
def build_plan_func():
    return [
        # (img, anchor句idx, weight)
        ("001_open.png", 0, 1.0),   # 预热/过渡
        ("002_upload.png", 1, 2.0),
        ("003_wall.png", 2, 1.5),
        # ... 覆盖该功能全部数据形态
    ]

def make(mp4_out, func, plan, mouse_timeline=None, voice_wav="voice"):  # noqa
    # 1) 读 words.json 得到每句时长 -> 镜头总时长 = 配音总时长(主时钟)
    # 2) 逐镜头: 图片重复对应秒数 + 烧字幕(_draw_subtitle)
    # 3) 若 mouse_timeline: 叠加合成鼠标(白箭头+点击脉冲), 坐标用浏览器 boundingBox 实测
    # 4) 写 silent.mp4; 拼 voice.wav(镜头间加静音); ffmpeg 音画合并 -shortest
    pass

def _draw_subtitle(frame, text):
    """字幕(基本配置): 无背景块 + 黑字(#080808) + 3px 白描边; 画在画面底部留白区, 不遮主要内容"""
    # 画布透明底 RGBA 层 -> 黑字 fill=(8,8,8,255) + stroke_width=3 stroke_fill=(255,255,255)
    # 合成到 frame 底部留白带(H-SUB_H:H); 不用背景条/不铺色块
    return frame

def _draw_mouse(frame, x, y, click=False):
    """叠加白箭头光标 + 橙圈点击脉冲; 封面/过渡页不要加鼠标"""
    return frame

if __name__ == "__main__":
    for func in ["enhance", "generate", "synthesize", "annotate", "intelligent"]:
        plan = build_plan_func()
        # mouse = probe_coords(func)   # 用浏览器 boundingBox 实测各按钮坐标
        make(os.path.join(FINAL, f"{func}_final.mp4"), func, plan)
