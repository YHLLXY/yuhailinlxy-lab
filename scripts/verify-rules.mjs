// /rules 回归：结构 + 性能对比读数 + 减少动效 + 布局
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4321';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browser = await chromium.launch({ executablePath: EDGE, env: process.env });
let failed = 0;
const check = (ok, label, extra = '') => {
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}${extra ? '  ' + extra : ''}`);
};

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/rules', { waitUntil: 'networkidle' });

  console.log('\n[结构]');
  const rules = await page.locator('section[aria-labelledby="rules-title"] li').count();
  const noMotion = await page.locator('section[aria-labelledby="nomotion-title"] .rounded-card').count();
  const checklist = await page.locator('section[aria-labelledby="check-title"] li').count();
  check(rules === 5, '铁律 5 条', `实际 ${rules}`);
  check(noMotion === 6, '不该动清单 6 条', `实际 ${noMotion}`);
  check(checklist === 8, '自检表 8 条', `实际 ${checklist}`);
  check((await page.locator('[data-perf-box]').count()) === 192, '两栏共 192 个方块');

  console.log('\n[性能对比]');
  await page.locator('[data-perf-run]').click();
  // 300ms 基线 + 1600 + 1600 + 余量
  await page.waitForTimeout(4600);
  const read = await page.evaluate(() => {
    const grab = (k, m) =>
      document.querySelector(`[data-perf-side="${k}"] [data-metric="${m}"]`)?.textContent?.trim();
    return {
      left: { fps: grab('left', 'fps'), worst: grab('left', 'worst'), dropped: grab('left', 'dropped') },
      transform: { fps: grab('transform', 'fps'), worst: grab('transform', 'worst'), dropped: grab('transform', 'dropped') },
      note: document.querySelector('[data-perf-note]')?.textContent?.trim(),
    };
  });
  console.log('    动 left     :', JSON.stringify(read.left));
  console.log('    动 transform:', JSON.stringify(read.transform));
  check(/^\d+$/.test(read.left.fps ?? ''), 'left 帧率是数字', read.left.fps);
  check(/^\d+$/.test(read.transform.fps ?? ''), 'transform 帧率是数字', read.transform.fps);
  check((read.note ?? '').includes('本次实测'), '结论文案已更新');
  console.log('    结论文案:', read.note);

  check(errors.length === 0, '无 JS 报错', errors.slice(0, 2).join(' | '));

  console.log('\n[布局]');
  for (const w of [375, 768, 1440]) {
    const c = await browser.newContext({ viewport: { width: w, height: 900 } });
    const p = await c.newPage();
    await p.goto(BASE + '/rules', { waitUntil: 'networkidle' });
    const bodyW = await p.evaluate(() => document.body.getBoundingClientRect().width);
    check(bodyW <= w + 1, `${w}px 无横向溢出`, `body=${bodyW}`);
    await c.close();
  }
  await ctx.close();

  console.log('\n[减少动效]');
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await c2.newPage();
  await p2.goto(BASE + '/rules', { waitUntil: 'networkidle' });
  await p2.locator('[data-perf-run]').click();
  await p2.waitForTimeout(400);
  const rmNote = await p2.evaluate(() => document.querySelector('[data-perf-note]')?.textContent?.trim());
  check((rmNote ?? '').includes('减少动效'), '减少动效下不采样并说明原因');
  await c2.close();
} finally {
  await browser.close();
}

console.log(`\n结果：${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
process.exit(failed === 0 ? 0 : 1);
