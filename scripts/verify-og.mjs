// 分享卡回归：PNG 规格 + dist 里每个页面的 OG 标签
//
// 用法：npm run build && node scripts/verify-og.mjs
// 只看静态产物，不需要起服务器 —— 这样 CI / 本地都能跑。

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

let failed = 0;
const check = (ok, label, extra = '') => {
  if (!ok) failed++;
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + label + (extra ? '  ' + extra : ''));
};

/** PNG 头两个 32 位大端整数就是宽高（IHDR 第 16、20 字节） */
function pngSize(buf) {
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkHtml(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const config = await readFile(join(ROOT, 'astro.config.mjs'), 'utf8');
const site = config.match(/site:\s*'([^']+)'/)?.[1];
console.log('[站点]');
check(Boolean(site), '能从 astro.config.mjs 读到 site', site ?? '');
if (!site) process.exit(1);

const expectedImage = site + '/og.png';

console.log('\n[public/og.png]');
const png = await readFile(join(PUBLIC, 'og.png'));
const size = pngSize(png);
check(Boolean(size), '是 PNG');
check(size?.width === 1200 && size?.height === 630, '尺寸 1200×630', size ? size.width + '×' + size.height : '');
check(png.length <= 300 * 1024, '体积 ≤ 300 KB', (png.length / 1024).toFixed(1) + ' KB');

const distPng = await readFile(join(DIST, 'og.png'));
check(pngSize(distPng)?.width === 1200, 'dist 里有同一张图', relative(ROOT, join(DIST, 'og.png')));

console.log('\n[页面标签]');
const pages = await walkHtml(DIST);
check(pages.length >= 5, '构建产物至少 5 个页面', String(pages.length));

for (const file of pages.sort()) {
  const html = await readFile(file, 'utf8');
  const rel = relative(DIST, file).replaceAll('\\', '/');
  const imageUrl = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1] ?? '';
  const width = html.match(/<meta[^>]*property="og:image:width"[^>]*content="([^"]+)"/)?.[1] ?? '';
  const height = html.match(/<meta[^>]*property="og:image:height"[^>]*content="([^"]+)"/)?.[1] ?? '';
  const alt = html.match(/<meta[^>]*property="og:image:alt"[^>]*content="([^"]+)"/)?.[1] ?? '';
  const card = html.match(/<meta[^>]*name="twitter:card"[^>]*content="([^"]+)"/)?.[1] ?? '';
  const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/)?.[1] ?? '';

  const ok =
    imageUrl === expectedImage &&
    width === '1200' &&
    height === '630' &&
    alt.length >= 10 &&
    card === 'summary_large_image' &&
    twitterImage === expectedImage;

  check(ok, rel, imageUrl === expectedImage ? 'og:image ✓' : 'og:image=' + (imageUrl || '缺失'));
  if (!ok) {
    console.log('    width=' + width + ' height=' + height + ' card=' + card + ' alt=' + alt.length + ' twitter:image=' + (twitterImage || '缺失'));
  }
}

console.log('\n结果：' + (failed === 0 ? '全部通过' : failed + ' 项失败'));
process.exit(failed === 0 ? 0 : 1);
