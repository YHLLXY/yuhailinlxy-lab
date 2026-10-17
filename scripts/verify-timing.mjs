// /timing 回归：11 行全部可展开可播放、三档同帧、重播、错峰、减少动效、布局
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4321';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browser = await chromium.launch({ executablePath: EDGE, env: process.env });
let failed = 0;
const check = (ok, label, extra = '') => {
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}${extra ? '  ' + extra : ''}`);
};
const scaleX = (t) => {
  const m = /matrix\(([-\d.e]+),/.exec(t || '');
  return m ? Number(m[1]) : NaN;
};

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/timing', { waitUntil: 'networkidle' });

  console.log('\n[结构]');
  const rows = page.locator('[data-timing-row]');
  check((await rows.count()) === 11, '场景行数 = 11', `实际 ${await rows.count()}`);
  const demosHidden = await page.locator('[data-demo]').evaluateAll((els) => els.every((e) => e.hidden));
  check(demosHidden, '初始全部收起');

  console.log('\n[11 行逐条可播放]');
  for (let i = 0; i < 11; i++) await rows.nth(i).locator('[data-try]').click();
  const opened = await page.locator('[data-demo]').evaluateAll((els) => els.every((e) => !e.hidden));
  check(opened, '11 行全部展开成功');
  const fillCount = await page.locator('[data-fill]').count();
  check(fillCount === 33, '共 33 条演示条（11 × 3）', `实际 ${fillCount}`);

  // 最长的一条是骨架屏「过慢」2400ms，等它跑完
  await page.waitForTimeout(2700);
  const finals = await page.locator('[data-fill]').evaluateAll((els) =>
    els.map((e) => getComputedStyle(e).transform),
  );
  const allDone = finals.every((t) => Math.abs(scaleX(t) - 1) < 0.01);
  check(allDone, '33 条全部到达终点', allDone ? '' : `异常 ${finals.filter((t) => Math.abs(scaleX(t) - 1) >= 0.01).length} 条`);

  console.log('\n[三档同帧]');
  const dt = await page.evaluate(async () => {
    const row = document.querySelectorAll('[data-timing-row]')[0];
    row.querySelector('[data-try]').click(); // 收起
    row.querySelector('[data-try]').click(); // 重新展开并播放
    const marks = [];
    const rec = (e) => marks.push({ ms: Number(e.target.dataset.ms), at: performance.now() });
    row.querySelectorAll('[data-fill]').forEach((f) => f.addEventListener('transitionstart', rec, { once: true }));
    row.querySelector('[data-try]').click();
    row.querySelector('[data-try]').click();
    await new Promise((r) => setTimeout(r, 400));
    if (marks.length < 2) return null;
    const times = marks.map((m) => m.at);
    return Math.round((Math.max(...times) - Math.min(...times)) * 1000) / 1000;
  });
  check(dt !== null && dt <= 16, '三条同一帧起跑', `Δt=${dt}ms`);

  console.log('\n[重播]');
  const replayOk = await page.evaluate(async () => {
    const row = document.querySelectorAll('[data-timing-row]')[0];
    const fill = row.querySelector('[data-fill]');
    row.querySelector('[data-replay]').click();
    await new Promise((r) => setTimeout(r, 30));
    return getComputedStyle(fill).transform;
  });
  check(scaleX(replayOk) < 1, '重播会从头开始', replayOk);

  console.log('\n[错峰对比]');
  const staggerInfo = await page.evaluate(async () => {
    const root = document.querySelector('[data-stagger]');
    root.querySelector('[data-stagger-play]').click();
    await new Promise((r) => setTimeout(r, 60));
    const groups = [...root.querySelectorAll('[data-stagger-group]')];
    return groups.map((g) =>
      [...g.querySelectorAll('[data-stagger-item]')].slice(0, 4).map((el) => getComputedStyle(el).transitionDelay),
    );
  });
  check(staggerInfo.length === 2, '两组并排');
  check(staggerInfo[0].every((d) => parseFloat(d) === 0), '左组无错峰', staggerInfo[0].join(','));
  const expected = ['0s', '0.06s', '0.12s', '0.18s'];
  const rightOk = staggerInfo[1].every((d, i) => Math.abs(parseFloat(d) - parseFloat(expected[i])) < 0.001);
  check(rightOk, '右组按 60ms 递增', staggerInfo[1].join(','));

  console.log('\n[布局]');
  for (const w of [375, 768, 1440]) {
    const c = await browser.newContext({ viewport: { width: w, height: 900 } });
    const p = await c.newPage();
    await p.goto(BASE + '/timing', { waitUntil: 'networkidle' });
    const bodyW = await p.evaluate(() => document.body.getBoundingClientRect().width);
    check(bodyW <= w + 1, `${w}px 无横向溢出`, `body=${bodyW}`);
    await c.close();
  }

  check(errors.length === 0, '无 JS 报错', errors.slice(0, 2).join(' | '));
  await ctx.close();

  console.log('\n[减少动效]');
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await c2.newPage();
  await p2.goto(BASE + '/timing', { waitUntil: 'networkidle' });
  await p2.locator('[data-timing-row]').first().locator('[data-try]').click();
  const rd = await p2.evaluate(() => {
    const f = document.querySelector('[data-fill]');
    return { dur: getComputedStyle(f).transitionDuration, t: getComputedStyle(f).transform };
  });
  check(parseFloat(rd.dur) < 0.01, '过渡被压到接近零', rd.dur);
  check(Math.abs(scaleX(rd.t) - 1) < 0.01, '直接呈现终点', rd.t);
  await c2.close();
} finally {
  await browser.close();
}

console.log(`\n结果：${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
process.exit(failed === 0 ? 0 : 1);
