// 截图工具：用系统 Edge 渲染本地构建产物，主用于视觉自查
//
// 为什么做成独立脚本而不是在宿主里内联跑：宿主的 process.env 可能是空的，
// 这种情况下 os.tmpdir() 会返回字面量 "undefined\\temp"，浏览器拿它当
// 用户数据目录就会弹「无法创建数据目录」。走真实 shell 就没有这个问题。
//
// 用法：
//   node scripts/shoot.mjs --url / --out screenshots/home.png \
//        --width 1440 --height 900 --scheme light --full

import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? fallback : argv[i + 1];
};

const url = arg('url', '/');
const out = arg('out', 'screenshots/shot.png');
const width = Number(arg('width', '1440'));
const height = Number(arg('height', '900'));
const scheme = arg('scheme', 'light');
const fullPage = argv.includes('--full');
const base = arg('base', 'http://localhost:4321');

const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.CHROME_PATH,
].filter(Boolean);

if (!process.env.TEMP || !process.env.TMP) {
  console.error('⚠ TEMP/TMP 为空，浏览器会无法创建配置目录。请从真实终端运行本脚本。');
}

await mkdir(dirname(out), { recursive: true });

const browser = await chromium.launch({
  executablePath: EDGE_CANDIDATES[0],
  // 显式继承环境，避免子进程拿不到临时目录
  env: process.env,
});

try {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  });

  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.screenshot({ path: out, fullPage });

  console.log(`${out}  ${width}x${height}  theme=${theme}  errors=${errors.length}`);
  if (errors.length) console.log('  ' + errors.slice(0, 3).join(' | '));
} finally {
  // 无论成功失败都关掉，避免像 ERR_CONNECTION_REFUSED 那样留下孤儿浏览器进程
  await browser.close();
}
