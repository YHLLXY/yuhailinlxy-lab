/**
 * 18 条缓动曲线。
 *
 * 来源与边界（见 docs/research/2026-10-17-M1-缓动曲线实现级调研.md）：
 * - 曲线名称与 cubic-bezier 四元组是数学事实，取自本地速查表
 * - 「用在哪 / 别用在哪 / 搭配时长」为本站原创编辑内容
 * - 未复制任何第三方仓库代码；ai/easings.net 为 GPL-3.0，只读不抄
 */

export type EasingCategory = 'enter' | 'exit' | 'move';

export interface EasingCurve {
  /** 锚点 id，用于卡片定位与分享链接 */
  id: string;
  /** 中文名 */
  name: string;
  /** 英文/别名，便于与业界术语对上 */
  alias: string;
  /** cubic-bezier 四个参数 */
  bezier: readonly [number, number, number, number];
  category: EasingCategory;
  /** 用在哪 */
  useWhen: string;
  /** 什么时候别用 */
  avoidWhen: string;
  /** 建议搭配时长（毫秒） */
  duration: number;
}

export const CATEGORY_LABEL: Record<EasingCategory, string> = {
  enter: '进场',
  exit: '退场',
  move: '位移',
};

export const CATEGORY_HINT: Record<EasingCategory, string> = {
  enter: '元素从无到有。观众只看得到「出现」这一下，所以要快、要稳。',
  exit: '元素从有到无。离开不该抢戏，通常比进场更快、更直接。',
  move: '元素从 A 到 B。两端都在画面上，首尾的速度必须被观众看见。',
};

export const EASINGS: EasingCurve[] = [
  // ───────────── 进场 7 条 ─────────────
  {
    id: 'out-standard',
    name: 'ease-out 标准',
    alias: 'ease-out',
    bezier: [0, 0, 0.2, 1],
    category: 'enter',
    useWhen: '最安全的进场默认值。卡片、气泡、下拉菜单从无到有。',
    avoidWhen: '大位移场景（全屏面板推开），起步太陡会显得「冲」。',
    duration: 200,
  },
  {
    id: 'out-expo',
    name: 'ease-out 夸张',
    alias: 'expo out',
    bezier: [0.16, 1, 0.3, 1],
    category: 'enter',
    useWhen: '要「高级感」时的第一选择。弹窗、抽屉、大图入场。',
    avoidWhen: '高频重复的微交互（hover、列表项），每次都这么夸张会累。',
    duration: 320,
  },
  {
    id: 'out-quint',
    name: 'ease-out 五次',
    alias: 'quint out',
    bezier: [0.22, 1, 0.36, 1],
    category: 'enter',
    useWhen: '想要 expo 的高级感但嫌它太急，用这条收敛一点。',
    avoidWhen: '短时长（<150ms）下它和标准 ease-out 几乎分不出来，白费。',
    duration: 280,
  },
  {
    id: 'out-circ',
    name: 'ease-out 圆润',
    alias: 'circ out',
    bezier: [0.33, 1, 0.68, 1],
    category: 'enter',
    useWhen: '末端尤其缓，适合「飘落」「浮现」这类需要余韵的进场。',
    avoidWhen: '需要明确「到此为止」的提示（来消息、报错），太软会显得没发生。',
    duration: 360,
  },
  {
    id: 'out-back',
    name: '回弹进场',
    alias: 'back out',
    bezier: [0.34, 1.56, 0.64, 1],
    category: 'enter',
    useWhen: '轻微过冲再回位。适合「蹦出来」的小元件：徽标、点赞、气泡。',
    avoidWhen: '信息密度高的界面。回弹会让用户以为有后续动作。',
    duration: 320,
  },
  {
    id: 'in-out-back',
    name: '强回弹',
    alias: 'back in-out',
    bezier: [0.68, -0.55, 0.27, 1.55],
    category: 'enter',
    useWhen: '两端都过冲，戏剧性强。适合空状态、引导页这类一次性的展示。',
    avoidWhen: '业务界面几乎都不该用。负向起步会被误读成「加载失败」。',
    duration: 480,
  },
  {
    id: 'out-subtle-overshoot',
    name: '轻微过冲',
    alias: 'subtle overshoot',
    bezier: [0.175, 0.885, 0.32, 1.275],
    category: 'enter',
    useWhen: '若隐若现的弹跳。想做「活」一点但又不想被注意到的场合。',
    avoidWhen: '和「回弹进场」同时出现在一屏里——差别太小，只会显得不一致。',
    duration: 300,
  },

  // ───────────── 退场 4 条 ─────────────
  {
    id: 'in-standard',
    name: 'ease-in 标准',
    alias: 'ease-in',
    bezier: [0.4, 0, 1, 1],
    category: 'exit',
    useWhen: '退场的默认值。淡出、收起、消失，交代清楚就走。',
    avoidWhen: '用户主动关闭的弹窗。加速离开会让人觉得是自己点错了。',
    duration: 160,
  },
  {
    id: 'in-expo',
    name: 'ease-in 夸张',
    alias: 'expo in',
    bezier: [0.7, 0, 0.84, 0],
    category: 'exit',
    useWhen: '「甩出去」。Toast 自动消失、被替换掉的临时提示。',
    avoidWhen: '用户可能后悔的操作。太快消失会来不及看清发生了什么。',
    duration: 200,
  },
  {
    id: 'in-circ',
    name: 'ease-in 圆润',
    alias: 'circ in',
    bezier: [0.32, 0, 0.67, 0],
    category: 'exit',
    useWhen: '与「ease-out 圆润」配对使用，做一进一出对称的往来动效。',
    avoidWhen: '单独使用。它自身没有明显性格，配不上对就浪费了。',
    duration: 240,
  },
  {
    id: 'in-back',
    name: '蓄力再走',
    alias: 'back in',
    bezier: [0.36, 0, 0.66, -0.56],
    category: 'exit',
    useWhen: '先反向蓄一点力再离开。适合「被吸走」的卡片，方向感强。',
    avoidWhen: '任何用户没预期到会消失的东西。反向位移会被读成「还有动作」。',
    duration: 240,
  },

  // ───────────── 位移 7 条 ─────────────
  {
    id: 'in-out-standard',
    name: 'ease-in-out 标准',
    alias: 'Material standard',
    bezier: [0.4, 0, 0.2, 1],
    category: 'move',
    useWhen: 'Material 标准曲线。位移类动效的默认答案。',
    avoidWhen: '需要强调「急」的场景——它太平稳，传达不了紧迫。',
    duration: 240,
  },
  {
    id: 'in-out-sine',
    name: 'ease-in-out 平滑',
    alias: 'sine in-out',
    bezier: [0.45, 0, 0.55, 1],
    category: 'move',
    useWhen: '完全对称，首尾速度一致。适合循环、往返、呼吸式的移动。',
    avoidWhen: '单向的一次性位移，它会让起点和终点都显得拖沓。',
    duration: 280,
  },
  {
    id: 'in-out-sharp',
    name: 'ease-in-out 尖锐',
    alias: 'sharp',
    bezier: [0.85, 0, 0.15, 1],
    category: 'move',
    useWhen: '两端极缓、中段飞快。适合大跨度位移：跨屏切换、长距离拖动。',
    avoidWhen: '短距离（<100px）位移。中段的突然加速会显得像卡顿。',
    duration: 320,
  },
  {
    id: 'in-out-expo',
    name: 'ease-in-out 夸张',
    alias: 'expo in-out',
    bezier: [0.83, 0, 0.17, 1],
    category: 'move',
    useWhen: '全屏转场、整页切换。够长才撑得住这种戏剧性的速度差。',
    avoidWhen: '小于 300ms 的动效。时间不够，观众只会看到「跳了一下」。',
    duration: 480,
  },
  {
    id: 'in-out-elastic',
    name: '弹性往返',
    alias: 'elastic',
    bezier: [0.68, -0.6, 0.32, 1.6],
    category: 'move',
    useWhen: '位移带弹性。适合可拖拽、可回弹的元素：滑块、卡片回位。',
    avoidWhen: '精确对位的场景。回弹会让用户怀疑没对齐。',
    duration: 400,
  },
  {
    id: 'spring',
    name: '弹簧感',
    alias: 'spring',
    bezier: [0.5, 1.8, 0.5, 0.8],
    category: 'move',
    useWhen: '点赞、气泡、确认勾选这类「有情绪」的小动作。',
    avoidWhen: '任何需要严肃或精确的界面。过冲量太大，像玩具。',
    duration: 360,
  },
  {
    id: 'magnetic',
    name: '磁吸',
    alias: 'magnetic',
    bezier: [0.2, 1.4, 0.4, 1],
    category: 'move',
    useWhen: '悬停跟随、拖拽吸附。快速靠近然后「吸住」。',
    avoidWhen: '没有明确目标位置的位移。磁吸的暗示太强，落点不对会很怪。',
    duration: 300,
  },
];

/** 生成 CSS 值，例如 cubic-bezier(0.16, 1, 0.3, 1) */
export function cssEasing([x1, y1, x2, y2]: readonly [number, number, number, number]): string {
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

export const EASINGS_BY_CATEGORY = (['enter', 'exit', 'move'] as const).map((category) => ({
  category,
  label: CATEGORY_LABEL[category],
  hint: CATEGORY_HINT[category],
  items: EASINGS.filter((e) => e.category === category),
}));
