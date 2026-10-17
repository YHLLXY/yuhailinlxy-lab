/**
 * /rules 的三块内容：五条铁律、不该动的清单、发布前自检表。
 * 均为本站原创编辑内容。
 */

export interface Rule {
  n: number;
  title: string;
  body: string;
  /** 违反它会怎样 */
  counter: string;
}

export const RULES: Rule[] = [
  {
    n: 1,
    title: '只动 transform 和 opacity',
    body: '改 width / left / top / margin 会触发重排，整条渲染流水线得从头再跑一遍。transform 和 opacity 可以只走合成层。',
    counter: '下面那两栏就是这条的现场：同一段动画，一个动 left，一个动 transform。',
  },
  {
    n: 2,
    title: '进场比退场慢',
    body: '用户等的是「出现」，不会等「消失」。常见配比是进场 250ms、退场 150ms。',
    counter: '退场和进场一样慢，界面会像在慢吞吞地收摊。',
  },
  {
    n: 3,
    title: '距离决定时长',
    body: '同样 300ms，位移 8px 显得从容，位移 300px 显得仓促。位移翻倍，时长至少 ×1.4。',
    counter: '全站统一 300ms 是最常见的偷懒，结果是小元素拖沓、大面板仓促。',
  },
  {
    n: 4,
    title: '同类动作只用一个时长',
    body: '一屏里所有「进入」用同一个数，所有「离开」用同一个数。节奏才能成立。',
    counter: '每张卡片随机 200~400ms，用户会觉得这个界面不稳定。',
  },
  {
    n: 5,
    title: '减少动效是换一种交代，不是取消交代',
    body: '开启 prefers-reduced-motion 后，应该直接呈现终态，让用户确认「事情发生了」；而不是什么都不发生。',
    counter: '直接不播 —— 用户点了按钮，界面毫无反应，他会以为坏了。',
  },
];

export const NO_MOTION: { title: string; why: string }[] = [
  { title: '高频操作', why: '滚动、输入、每次按键都触发的东西。第 50 次看到它只会烦。' },
  { title: '系统级反馈', why: '保存成功、发送失败。这类要的是立刻看清结果，不是看动画。' },
  { title: '内容阅读路径', why: '正文进入、图片切换的入场。读者是来读字的，不是来看转场的。' },
  { title: '用户已经等过的地方', why: '加载完成后就别再「庆祝」了，等待已经付过成本。' },
  { title: '长列表的重复元素', why: '第 20 项还做错峰入场，只会让最后几项出现得更晚。' },
  { title: '表单报错', why: '抖动会加重焦虑。报错要稳、要显眼，不要活泼。' },
];

export const CHECKLIST: string[] = [
  '动画只作用在 transform / opacity 上',
  '进场 ≤ 400ms，退场明显更快',
  '开启减少动效后，仍能直接看到终点状态',
  '动画中途被打断时，从当前值继续而不是跳回起点',
  '没有任何信息只能靠动画才能理解',
  '首屏没有自动播放的动画',
  '深色 / 浅色两套主题都实际看过',
  '键盘操作路径上没有被动画挡住',
];
