// 录屏骨架：Playwright 自动操作 + 关键帧截图
// 用法: 设 NODE_PATH 指向你的 node_modules; 系统 Chrome 可 headless
//       node record_template.js   (需先在同命令内启动静态服务器)
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:8300';          // 你的服务器
const PAGE = '/demo.html';                          // 每个功能一个页面
const OUT = path.join(__dirname, '..', 'out', 'frames', 'demo'); // 关键帧输出目录
const VW = { width: 1680, height: 940 };
const SLEEP = 1600;   // 通用等待(ms), 动画类用 4200
const ANIM = 4200;

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: VW });
  let seq = 0;
  const shot = async (tag) => {
    await page.screenshot({ path: path.join(OUT, `frame_${String(seq++).padStart(5, '0')}_${tag}.png`) });
  };

  await page.goto(BASE_URL + PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot('open_page');

  // —— 形态1 流程：上传 → 配置 → 执行 → 结果墙 → 采纳入库 ——
  // headless 不能真实选文件: 触发页面预置数据填充
  await page.evaluate(() => window.onFiles && window.onFiles({ length: 0 }));
  await page.waitForTimeout(SLEEP);
  await shot('upload_done');

  await page.click('selector_for_config');       // 配置参数
  await page.waitForTimeout(SLEEP);
  await shot('params_set');

  await page.click('selector_for_run');          // 开始执行
  await page.waitForTimeout(ANIM);
  await shot('result_wall');

  await page.click('selector_for_accept');
  await page.waitForTimeout(SLEEP);
  await shot('accept_open');

  await page.click('selector_for_save');
  await page.waitForTimeout(SLEEP);
  await shot('saved_done');

  // —— 形态2 流程(如有): 切换数据类型后重复 ——
  // await page.click('input[name=dtype][value=text]'); // 触发真实 change
  // ...

  await browser.close();
})();
