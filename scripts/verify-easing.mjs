// /easing 页面的回归自检：卡片数量、播放是否真的在动、复制是否可用、减少动效是否生效
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
  // ── 1. 结构 ──
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + '/easing', { waitUntil: 'networkidle' });

    const cards = await page.locator('[data-easing-card]').count();
    console.log('\n[结构]');
    check(cards === 18, '卡片数量 = 18', `实际 ${cards}`);
    check(errors.length === 0, '无 JS 报错', errors.slice(0, 2).join(' | '));

    const sections = await page.locator('section[aria-labelledby^="group-"]').count();
    check(sections === 3, '分组数量 = 3', `实际 ${sections}`);

    // ── 2. 播放确实在动 ──
    console.log('\n[播放]');
    const first = page.locator('[data-easing-card]').first();
    await first.locator('[data-play]').click();
    await page.waitForTimeout(60);
    const mid = await first.locator('[data-dot]').evaluate((el) => ({
      transform: getComputedStyle(el).transform,
      anims: el.getAnimations().length,
    }));
    await page.waitForTimeout(600);
    const end = await first.locator('[data-dot]').evaluate((el) => getComputedStyle(el).transform);
    const moved = mid.transform !== 'none' && mid.transform !== end;
    check(mid.anims > 0, '播放后存在运行中的动画', `anims=${mid.anims}`);
    check(moved, '圆点位置随动画推进', `中段=${mid.transform} 末段=${end}`);

    // ── 3. 复制 ──
    console.log('\n[复制]');
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
    const copyBtn = first.locator('[data-copy]');
    await copyBtn.click();
    await page.waitForTimeout(120);
    const label = await copyBtn.textContent();
    check(label?.includes('已复制'), '复制按钮反馈', `文案=${label}`);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    check(/^cubic-bezier\(/.test(clip), '剪贴板内容为 cubic-bezier', clip);

    await ctx.close();
  }

  // ── 4. 减少动效 ──
  {
    console.log('\n[减少动效]');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/easing', { waitUntil: 'networkidle' });
    const motion = await page.getAttribute('html', 'data-motion');
    check(motion === 'reduce', 'data-motion = reduce', motion ?? '');
    const first = page.locator('[data-easing-card]').first();
    await first.locator('[data-play]').click();
    await page.waitForTimeout(80);
    const st = await first.locator('[data-dot]').evaluate((el) => ({
      anims: el.getAnimations().length,
      t: getComputedStyle(el).transform,
    }));
    check(st.anims === 0, '不播放动画', `anims=${st.anims}`);
    check(st.t !== 'none' && !st.t.includes('matrix(1, 0, 0, 1, 0, 0)'), '直接呈现终点状态', st.t);
    await ctx.close();
  }

  // ── 5. 溢出 ──
  console.log('\n[布局]');
  for (const w of [375, 768, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/easing', { waitUntil: 'networkidle' });
    const bodyW = await page.evaluate(() => document.body.getBoundingClientRect().width);
    check(bodyW <= w + 1, `${w}px 无横向溢出`, `body=${bodyW}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log(`\n结果：${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
process.exit(failed === 0 ? 0 : 1);
