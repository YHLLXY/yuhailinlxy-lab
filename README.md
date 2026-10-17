# 动效实验室

**动效决策手册的可交互版。** 部署在 <https://lab.yuhailinlxy.com>。

不是素材库，不是曲线收藏夹。每一段演示都回答三个问题：**用在哪 / 多久 / 什么时候不该用。**

---

## 开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```

Windows 下如果 `npm` 被执行策略拦住，用 `npm.cmd`。

## 截图自查

```bash
npm run preview -- --port 4321        # 另开一个终端
node scripts/shoot.mjs --url / --out screenshots/home.png --width 1440 --height 900 --scheme dark --full
```

用系统 Edge 渲染，不下载浏览器。**必须从真实终端跑**：如果 `process.env` 是空的，
`os.tmpdir()` 会返回字面量 `undefined\temp`，Edge 会弹「无法创建数据目录」。

## 目录

```
src/
  components/   页头、页脚、主题开关等通用块
  layouts/      Base.astro —— 全站唯一的外壳
  pages/        /  /easing  /timing  /rules
  styles/       global.css —— 设计令牌与基础样式全在这一个文件
public/         favicon、robots
```

## 铁律

改这个仓库之前先读一遍，这几条不是建议：

1. **不抄第三方代码。** 特效参考存在本地 `E:\homework\开发\特效存储`，那里 74 个仓库只用来读思路，一行都不能出现在这个仓库里。曲线数值（cubic-bezier 的四个数字）属于数学事实，可以用；代码、文案、视觉不行。
2. **站内默认静止。** 除了用户主动触发的演示，页面自身不动 —— 没有滚动入场、没有自动播放、没有 loading 动画。一个讲动效克制的站点，自己先克制。
3. **不引动效库。** 不用 GSAP / Framer Motion / anime.js。原生 CSS + 少量 JS 足够，且能保证 `prefers-reduced-motion` 真正可控。
4. **JS 预算。** 首屏 JS < 25 KB（gzip），单页 JS < 12 KB。加任何依赖前先算这笔账。
5. **减少动效不是「关掉」。** 用户开启减少动效时，演示应直接呈现结果状态，而不是什么都不发生。
6. **零图标字体。** 图标一律内联 SVG。

## 无障碍基线

- 所有交互可用键盘完成，焦点环可见
- 颜色对比：正文 ≥ 4.5:1，图形元素 ≥ 3:1
- 深浅色两套都测，不能只调一套

---

文档在 `E:\homework\"余粮"项目\docs`（调研 + 实施计划）。
