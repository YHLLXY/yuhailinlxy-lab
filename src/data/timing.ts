/**
 * 11 个时长场景。
 *
 * 来源：本地速查表「时长基准表」，与 plan 里的 11 个场景逐条对应。
 * 交叉验证：Material 3 duration tokens（Apache-2.0），数值见 material 字段。
 * 「过快 / 过慢」是按基准 ±50%~100% 推导的编辑部判断，不是外部权威数据。
 */

export interface TimingScenario {
  id: string;
  name: string;
  /** 速查表里的原始区间 */
  range: string;
  /** 演示用的基准值 */
  base: number;
  fast: number;
  slow: number;
  /** CSS 缓动 */
  easing: string;
  easingName: string;
  /** 为什么是这个数 */
  why: string;
  /** 对应的 Material 3 档位 */
  material: string;
}

export const TIMING_SCENARIOS: TimingScenario[] = [
  {
    id: 'hover',
    name: '按钮 / 链接悬停',
    range: '100–150ms',
    base: 120,
    fast: 60,
    slow: 240,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    easingName: 'ease-out 标准',
    why: '低于 100ms 像「闪了一下」，超过 150ms 光标都移开了颜色还在变。',
    material: 'short2–short3',
  },
  {
    id: 'toggle',
    name: '开关 / 复选 / 点赞',
    range: '150–250ms',
    base: 200,
    fast: 100,
    slow: 400,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easingName: '回弹进场',
    why: '要有「咔哒」的确认感。太快像没执行，太慢像卡住了。',
    material: 'short4',
  },
  {
    id: 'tooltip',
    name: 'Tooltip / Popover',
    range: '150–200ms',
    base: 180,
    fast: 90,
    slow: 360,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    easingName: 'ease-out 标准',
    why: '悬停即出，但退场要更快（约 100ms），否则鼠标移开了它还挡着。',
    material: 'short3–short4',
  },
  {
    id: 'dropdown',
    name: '下拉菜单 / Select',
    range: '200–250ms',
    base: 220,
    fast: 110,
    slow: 440,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    easingName: 'ease-out 标准',
    why: '面板要落下 4–8px，比 Tooltip 更「重」，所以再多给一点时间。',
    material: 'short4–medium1',
  },
  {
    id: 'modal',
    name: 'Modal / Dialog',
    range: '250–350ms',
    base: 300,
    fast: 150,
    slow: 600,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easingName: 'ease-out 夸张',
    why: '遮罩和内容分开算：遮罩 200ms 淡入，内容 250ms 从 0.96 放大到 1。',
    material: 'medium2',
  },
  {
    id: 'drawer',
    name: 'Drawer / 抽屉',
    range: '250–400ms',
    base: 320,
    fast: 160,
    slow: 640,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easingName: 'ease-in-out 标准',
    why: '与滑出距离成正比。半屏抽屉 320ms 够用，全屏推到 400ms。',
    material: 'medium2–medium3',
  },
  {
    id: 'tab',
    name: 'Tab 切换指示条',
    range: '250–350ms',
    base: 280,
    fast: 140,
    slow: 560,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easingName: 'ease-in-out 标准',
    why: '用户会盯着这条线看它去哪儿，慢一点才跟得上眼睛。',
    material: 'medium1–medium2',
  },
  {
    id: 'list',
    name: '列表项增删（FLIP）',
    range: '250–350ms',
    base: 300,
    fast: 150,
    slow: 600,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    easingName: 'ease-out 标准',
    why: '位移和被顶开的其他项同时发生，两件事要一起看完，需要时间消化。',
    material: 'medium2',
  },
  {
    id: 'route',
    name: '页面路由转场',
    range: '300–500ms',
    base: 400,
    fast: 200,
    slow: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easingName: 'ease-in-out 标准',
    why: '旧页 200ms 退、新页 300ms 进，重叠之后总感知大约 400ms。',
    material: 'medium4',
  },
  {
    id: 'skeleton',
    name: '骨架屏闪烁',
    range: '1.2–1.8s 循环',
    base: 1500,
    fast: 700,
    slow: 2400,
    easing: 'linear',
    easingName: '线性',
    why: '循环动画。太快像故障闪烁，太慢像页面卡死了。',
    material: '—（非状态过渡）',
  },
  {
    id: 'counter',
    name: '数字滚动',
    range: '600–1200ms',
    base: 900,
    fast: 300,
    slow: 1800,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easingName: 'expo out',
    why: '位数越多越久：两位数 600ms，五位数可以到 1200ms。',
    material: 'extra-long3',
  },
];

export const TIMING_COUNT = TIMING_SCENARIOS.length;

/** Stagger 演示用的固定参数（来自速查表「编排模式」） */
export const STAGGER = {
  items: 8,
  base: 320,
  gap: 60,
  note: '相邻间隔 40–80ms；超过 8 项后建议截断，总入场控制在 600ms 内。',
};
