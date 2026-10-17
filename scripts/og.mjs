// 生成分享卡 public/og.png
//
// 为什么用浏览器渲染、而不是 satori：见 docs/research/2026-10-17-OG分享卡调研.md
// 为什么必须从真实终端跑：宿主的 process.env 可能为空，os.tmpdir() 会变成字面量
// "undefined\\temp"，浏览器拿它当配置目录会直接失败（同 scripts/shoot.mjs）。

import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = resolve(ROOT, 'public/og.png');
const TEMPLATE = resolve(HERE, 'og-template.html');
const DATA = resolve(ROOT, 'src/data/easings.ts');

// 模板里 SVG 的绘制区（viewBox 388×236，底线在 235）
const CHART = { w: 388, h: 235 };

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));

if (!EDGE) {
  console.error('✗ 找不到系统 Edge，无法渲染分享卡');
  process.exit(1);
}

if (!process.env.TEMP || !process.env.TMP) {
  console.error('⚠ TEMP/TMP 为空，浏览器会无法创建配置目录。请从真实终端运行本脚本。');
}

/** 从 easings.ts 里读一条曲线的四个参数，避免图与数据漂移 */
function readBezier(source, id) {
  const re = new RegExp("id:\\s*'" + id + "'[\\s\\S]{0,300}?bezier:\\s*\\[([^\\]]+)\\]");
  const m = source.match(re);
  if (!m) throw new Error('src/data/easings.ts 里读不到 ' + id + ' 的 bezier');
  const nums = m[1].split(',').map((s) => Number(s.trim()));
  if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n))) {
    throw new Error(id + ' 的 bezier 不是四个数字：' + m[1]);
  }
  return nums;
}

/** cubic-bezier(x1,y1,x2,y2) → SVG 三次贝塞尔路径 */
function pathOf([x1, y1, x2, y2]) {
  const r = (n) => Math.round(n * 10) / 10;
  const p = [
    0,
    CHART.h,
    x1 * CHART.w,
    CHART.h - y1 * CHART.h,
    x2 * CHART.w,
    CHART.h - y2 * CHART.h,
    CHART.w,
    0,
  ].map(r);
  return 'M' + p[0] + ' ' + p[1] + 'C' + p[2] + ' ' + p[3] + ' ' + p[4] + ' ' + p[5] + ' ' + p[6] + ' ' + p[7];
}

const source = await readFile(DATA, 'utf8');
const outBezier = readBezier(source, 'out-expo');
const inBezier = readBezier(source, 'in-expo');

const template = await readFile(TEMPLATE, 'utf8');
const html = template
  .replaceAll('{{OUT_PATH}}', pathOf(outBezier))
  .replaceAll('{{IN_PATH}}', pathOf(inBezier))
  .replaceAll('{{OUT_BEZIER}}', outBezier.join(', '))
  .replaceAll('{{IN_BEZIER}}', inBezier.join(', '));

if (html.includes('{{')) throw new Error('模板里还有没替换的占位符');

const browser = await chromium.launch({ executablePath: EDGE, env: process.env });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    colorScheme: 'light',
  });

  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForTimeout(120);

  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1200, height: 630 } });
} finally {
  await browser.close();
}

const png = await readFile(OUT);
const signature = png.subarray(0, 8).toString('hex');
if (signature !== '89504e470d0a1a0a') throw new Error('输出不是 PNG');
const w = png.readUInt32BE(16);
const h = png.readUInt32BE(20);

console.log(
  'og.png  ' + w + '×' + h + '  ' + (png.length / 1024).toFixed(1) + ' KB' +
  '  out-expo(' + outBezier.join(',') + ')  in-expo(' + inBezier.join(',') + ')'
);

if (w !== 1200 || h !== 630) {
  console.error('✗ 尺寸应为 1200×630');
  process.exit(1);
}
if (png.length > 300 * 1024) {
  console.error('✗ 超过 300 KB（WhatsApp 软上限）');
  process.exit(1);
}
