// 对照台回归检查：选中/渲染/同帧起跑/时长切换/减少动效
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
  await page.goto(BASE + '/easing', { waitUntil: 'networkidle' });

  const cards = page.locator('[data-easing-card]');
  const pick = (i) => cards.nth(i).locator('[data-pick]').click();

  console.log('\n[初始状态]');
  check(await page.locator('[data-compare-controls]').isHidden(), '未选满时控制条隐藏');
  check((await page.locator('[data-slot="a"] [data-slot-name]').textContent())?.trim() === '未选', 'A 槽为空');
  check((await page.locator('[data-compare-chart] path').count()) === 0, '图表无曲线');

  console.log('\n[选择]');
  await pick(0);
  check((await page.locator('[data-slot="a"] [data-slot-name]').textContent())?.includes('ease-out 标准'), '第 1 条进入 A 槽');
  check(await page.locator('[data-compare-controls]').isHidden(), '只选 1 条时仍不可播放');

  await pick(1);
  const state2 = await page.evaluate(() => ({
    a: document.querySelector('[data-slot="a"] [data-slot-name]')?.textContent?.trim(),
    b: document.querySelector('[data-slot="b"] [data-slot-name]')?.textContent?.trim(),
    paths: document.querySelectorAll('[data-compare-chart] path').length,
    controlsHidden: document.querySelector('[data-compare-controls]')?.hidden,
    pressed: document.querySelectorAll('[data-pick][aria-pressed="true"]').length,
  }));
  check(state2.b?.includes('ease-out 夸张'), '第 2 条进入 B 槽', String(state2.b));
  check(state2.paths === 2, '图表绘制两条曲线', `paths=${state2.paths}`);
  check(state2.controlsHidden === false, '控制条出现');
  check(state2.pressed === 2, '两张卡片标记为已选', `pressed=${state2.pressed}`);

  console.log('\n[同帧起跑]');
  const timing = await page.evaluate(async () => {
    const dotA = document.querySelector('[data-dot="a"]');
    const dotB = document.querySelector('[data-dot="b"]');
    const marks = [];
    const rec = (e) => marks.push({ id: e.target.dataset.dot, at: performance.now() });
    dotA.addEventListener('transitionstart', rec, { once: true });
    dotB.addEventListener('transitionstart', rec, { once: true });
    document.querySelector('[data-compare-play]').click();
    await new Promise((r) => setTimeout(r, 700));
    const a = marks.find((m) => m.id === 'a');
    const b = marks.find((m) => m.id === 'b');
    return a && b ? Math.round(Math.abs(a.at - b.at) * 1000) / 1000 : null;
  });
  check(timing !== null && timing <= 16, '两条过渡在同一帧启动', `Δt=${timing}ms`);

  const endPos = await page.evaluate(() => {
    const read = (k) => getComputedStyle(document.querySelector(`[data-dot="${k}"]`)).transform;
    return { a: read('a'), b: read('b') };
  });
  const moved = (t) => t !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(t);
  check(moved(endPos.a) && moved(endPos.b), '两条都跑到了终点', `A=${endPos.a} B=${endPos.b}`);

  console.log('\n[时长切换]');
  await page.locator('[data-compare-play]').click();
  await page.locator('.compare-dur[data-dur="160"]').click();
  const dur = await page.evaluate(() => {
    document.querySelector('[data-compare-play]').click();
    return getComputedStyle(document.querySelector('[data-dot="a"]')).transitionDuration;
  });
  check(dur.startsWith('0.16s'), '160ms 档位生效', dur);
  await page.locator('.compare-dur[data-dur="320"]').click();

  console.log('\n[第三条替换最旧]');
  await pick(2);
  const state3 = await page.evaluate(() => ({
    a: document.querySelector('[data-slot="a"] [data-slot-name]')?.textContent?.trim(),
    pressed: document.querySelectorAll('[data-pick][aria-pressed="true"]').length,
  }));
  check(state3.a?.includes('ease-out 夸张'), 'A 槽换成原 B', String(state3.a));
  check(state3.pressed === 2, '始终最多两条', `pressed=${state3.pressed}`);

  console.log('\n[清空]');
  await page.locator('[data-compare-clear]').click();
  check((await page.locator('[data-slot="a"] [data-slot-name]').textContent())?.trim() === '未选', 'A 槽清空');
  check((await page.locator('[data-compare-chart] path').count()) === 0, '图表清空');

  check(errors.length === 0, '全程无 JS 报错', errors.slice(0, 2).join(' | '));
  await ctx.close();

  console.log('\n[减少动效下的对照台]');
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + '/easing', { waitUntil: 'networkidle' });
  await p2.locator('[data-easing-card]').nth(0).locator('[data-pick]').click();
  await p2.locator('[data-easing-card]').nth(1).locator('[data-pick]').click();
  const rd = await p2.evaluate(() => {
    document.querySelector('[data-compare-play]').click();
    return {
      dur: getComputedStyle(document.querySelector('[data-dot="a"]')).transitionDuration,
      transform: getComputedStyle(document.querySelector('[data-dot="a"]')).transform,
    };
  });
  check(parseFloat(rd.dur) < 0.01, '过渡被压到接近零', rd.dur);
  check(rd.transform !== 'none', '仍然呈现终点位置', rd.transform);
  await ctx2.close();
} finally {
  await browser.close();
}

console.log(`\n结果：${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
process.exit(failed === 0 ? 0 : 1);
