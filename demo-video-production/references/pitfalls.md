# 高频踩坑与解法

> 主要在 Windows 环境遇到的坑；其他平台原理类似。新环境先对照自查。

## 环境/进程
| 坑 | 现象 | 解法 |
|---|---|---|
| 后台服务器跨会话不保活 | 录屏时 `ERR_CONNECTION_REFUSED` | 起服务 + 跑录屏放**同一条命令**；用 `Start-Process node`/子 shell 起服务 |
| 子进程找不到 node | `spawn node ENOENT` | 外部独立起服务，不要在脚本里再 spawn |
| 系统无 ffmpeg | 无法合并音视频 | `pip install imageio-ffmpeg`（用国内镜像），取其打包的 ffmpeg |

## 中文路径（OpenCV 尤其）
| 坑 | 解法 |
|---|---|
| 读中文路径失败 `can't open/read file` | `np.fromfile` + `cv2.imdecode` |
| 写中文路径失败 | `cv2.imencode` + `np.tofile`（少用 cv2.imwrite） |
| 写含全角括号(（）)的文件名出路径问题 | 用 ASCII 临时名生成再改名，或统一避免全角括号 |

## 合成/时长
| 坑 | 解法 |
|---|---|
| 成片时长翻倍(≈2×预期) | 镜头总时长**按唯一旁白句锚定**，再按镜头权重瓜分；别让共用句重复计时 |
| 旧 silent/final 缓存污染(删了还"存在") | 重合成前显式删旧文件，ffmpeg 复查时长确认为新文件 |
| `-shortest` 取错流 | 先各看 silent/voice 时长，`-shortest` 应得较短者 |

## 浏览器自动化(Playwright/Chrome)
| 坑 | 解法 |
|---|---|
| `Cannot find module playwright-core` | 设 `NODE_PATH` 指向项目 node_modules |
| headless 起不来(缺浏览器) | 直接用系统 Chrome 的 `executablePath` |
| headless 不能真实选文件 | `page.evaluate(()=>window.onFiles({length:0}))` 触发预置数据 |
| 探测坐标时模板串被 shell 展开 | 用 `pg['$']` 规避 PowerShell 的 `pg.$(sel)` 展开 |

## 控制台/文本
| 坑 | 解法 |
|---|---|
| PowerShell 中文输出乱码 | 写 UTF-8 文件再用 read 工具读；别直接读中文输出 |
| 内联 f-string/复杂命令报错 | 写成 `.py/.js` 文件跑，避免内联转义 |

## 数据/内容
- 照片类内容纯程序画线不达标 → 用免费图库真实照片 + 做旧。
- 类别语义错(把 A 对象标成 B)比缺图更致命 → 涉及语义先跟用户对齐。
- 文档标题样式 id：不同来源文档的 Heading/tbl 样式 id 体系可能不同(数字 vs 字母)，deepcopy 合并时必须重映射，否则标题格式全丢。
