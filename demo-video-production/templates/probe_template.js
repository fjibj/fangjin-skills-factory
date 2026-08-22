// 坐标探测骨架：用浏览器 boundingBox 实测页面元素的真实中心坐标
// 用于"合成鼠标"时让点击精准落在按钮正上方。
// 用法: 设 NODE_PATH 指向 node_modules; 同命令内先起静态服务器
const { chromium } = require('playwright-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:8300';
const PAGE = '/demo.html';

// 列出需要探测元素坐标的选择器，用页面内文本做选择更稳(可点文字命中)
const TARGETS = [
  { name: '执行按钮',  sel: 'text=开始执行' },
  { name: '采纳按钮',  sel: 'text=采纳所选' },
  { name: '保存按钮',  sel: 'text=保存入库' },
  { name: 'run',       sel: '#runBtn' },
  { name: 'accept',    sel: '#acceptBtn' },
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1'] });
  const pg = await b.newPage({ viewport: { width: 1680, height: 940 } });
  await pg.goto(BASE_URL + PAGE, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(800);
  const out = {};
  for (const t of TARGETS) {
    try {
      const el = await pg.locator(t.sel).first();
      const bb = await el.boundingBox();
      if (!bb) { console.log('MISS', t.name, t.sel); continue; }
      // 中心坐标(供叠加鼠标)
      out[t.name] = { x: +(bb.x + bb.width / 2).toFixed(1), y: +(bb.y + bb.height / 2).toFixed(1) };
      console.log(t.name, JSON.stringify(out[t.name]));
    } catch (e) { console.log('ERR', t.name, e.message); }
  }
  await b.close();
  console.log('RESULT', JSON.stringify(out));
})();
