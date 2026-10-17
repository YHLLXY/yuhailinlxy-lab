// 首页回归：hero 双曲线同帧播放、入口链接、sitemap
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
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  console.log('\n[首页结构]');
  check((await page.locator('[data-hero-track]').count()) === 2, '两条演示轨道');
  check((await page.locator('a[href="/easing"]').count()) >= 1, '有缓动曲线入口');
  check((await page.locator('a[href="/timing"]').count()) >= 1, '有时长节奏入口');
  check((await page.locator('a[href="/rules"]').count()) >= 1, '有原则入口');

  console.log('\n[hero 同帧播放]');
  const dt = await page.evaluate(async () => {
    const dots = [...document.querySelectorAll('[data-hero-dot]')];
    const marks = [];
    dots.forEach((d) => d.addEventListener('transitionstart', (e) => marks.push({ at: performance.now(), w: e.target.getAnimations?.().length }), { once: true }));
    document.querySelector('[data-hero-play]').click();
    await new Promise((r) => setTimeout(r, 600));
    if (marks.length < 2) return null;
    const t = marks.map((m) => m.at);
    return Math.round((Math.max(...t) - Math.min(...t)) * 1000) / 1000;
  });
  check(dt !== null && dt <= 16, '两条同帧起跑', `Δt=${dt}ms`);

  const moved = await page.evaluate(() =>
    [...document.querySelectorAll('[data-hero-dot]')].map((d) => getComputedStyle(d).transform),
  );
  const ok = moved.every((t) => t !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(t));
  check(ok, '两条都到达终点', moved.join(' | '));

  check(errors.length === 0, '无 JS 报错', errors.slice(0, 2).join(' | '));

  console.log('\n[sitemap]');
  // 走 Playwright 自己的网络栈；某些网络环境下 *.vercel.app 会被解析到污染 IP，
  // 这时只报「无法判定」，不让整轮检查崩掉。
  try {
    const sm = await page.request.get(BASE + '/sitemap-index.xml', { timeout: 15000 });
    check(sm.status() === 200, 'sitemap-index.xml 可访问', String(sm.status()));
    check((await sm.text()).includes('lab.yuhailinlxy.com'), 'sitemap 域名正确');
  } catch (err) {
    console.log('  ⚠ sitemap 检查跳过（本机网络解析异常）:', String(err).split('\n')[0].slice(0, 80));
  }

  console.log('\n[布局]');
  for (const w of [375, 768, 1440]) {
    const c = await browser.newContext({ viewport: { width: w, height: 900 } });
    const p = await c.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    const bodyW = await p.evaluate(() => document.body.getBoundingClientRect().width);
    check(bodyW <= w + 1, `${w}px 无横向溢出`, `body=${bodyW}`);
    await c.close();
  }
  await ctx.close();

  console.log('\n[减少动效]');
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await c2.newPage();
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p2.locator('[data-hero-play]').click();
  const rd = await p2.evaluate(() => {
    const d = document.querySelector('[data-hero-dot]');
    return { dur: getComputedStyle(d).transitionDuration, t: getComputedStyle(d).transform };
  });
  check(parseFloat(rd.dur) < 0.01, '过渡被压到接近零', rd.dur);
  await c2.close();
} finally {
  await browser.close();
}

console.log(`\n结果：${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
process.exit(failed === 0 ? 0 : 1);
