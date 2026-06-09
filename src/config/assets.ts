/**
 * UI 资源配置中心 (Single Source of Truth)
 *
 * 替换游戏内容只改这个文件:
 * - 食材列表: 改 INGREDIENTS 数组,加/删/换 emoji、图片、点击类型
 * - 背景音乐 / 音效: 改 AUDIO
 * - 配色: 改 PALETTE (theme.css 自动跟随)
 * - 字体: 改 FONTS
 *
 * 图片字段为空(undefined / 空串)时,组件会自动 fallback 到 emoji。
 * 音效字段为空时,该音效不播放(不会报错)。
 */

export type IngredientType = 'tap' | 'hold';

export type IngredientConfig = {
  /** 内部稳定 ID,组件用它识别食材;改了会让在跑的存档失效 */
  id: string;
  /** 多语言显示名 */
  name: { zh: string; en: string };
  /** Fallback emoji,图片缺失时显示 */
  emoji: string;
  /** 玩法类型: tap=快按 / hold=长按 */
  type: IngredientType;
  /** 完整食材图(传送带 + 加工台开始切之前) */
  imageWhole?: string;
  /** 切片后图(加工台切完显示) */
  imageSliced?: string;
};

/**
 * 游戏内出现的食材池。传送带模式从这里随机出题,加工台模式按收集顺序加工。
 *
 * 想换主题(比如三明治、寿司、烧烤)?直接改这里,其他文件不用动。
 */
export const INGREDIENTS: IngredientConfig[] = [
  {
    id: 'watermelon',
    name: { zh: '西瓜', en: 'Watermelon' },
    emoji: '🍉',
    type: 'tap',
  },
  {
    id: 'tomato',
    name: { zh: '番茄', en: 'Tomato' },
    emoji: '🍅',
    type: 'tap',
  },
  {
    id: 'cucumber',
    name: { zh: '黄瓜', en: 'Cucumber' },
    emoji: '🥒',
    type: 'hold',
  },
  {
    id: 'carrot',
    name: { zh: '胡萝卜', en: 'Carrot' },
    emoji: '🥕',
    type: 'tap',
  },
  {
    id: 'eggplant',
    name: { zh: '茄子', en: 'Eggplant' },
    emoji: '🍆',
    type: 'hold',
  },
];

/** 通过 id 拿食材配置 */
export function getIngredient(id: string): IngredientConfig | undefined {
  return INGREDIENTS.find((i) => i.id === id);
}

/** 拿食材本地化名 */
export function getIngredientName(id: string, lang: 'zh' | 'en'): string {
  return getIngredient(id)?.name[lang] ?? id;
}

/* ------------------------------------------------------------------ */
/* 音频 — 已拆分至 ./audio.ts,这里仅 re-export 方便统一引入。              */
/* ------------------------------------------------------------------ */

export { AUDIO, BGM, SFX, VOLUME } from './audio';
export type { SfxKey, BgmKey } from './audio';

/* ------------------------------------------------------------------ */
/* 配色                                                                 */
/* ------------------------------------------------------------------ */

/**
 * 游戏调色板 — Stardew Valley / Nintendo 像素风:
 * - 鲜亮草绿背景(像 Stardew 草地)
 * - 厚重深棕描边 + 像素步阶硬阴影
 * - 高饱和原色 CTA(番茄红 / 蛋黄)
 * - 米色羊皮纸卡片
 */
export const PALETTE = {
  primary: '#E84A3F',        // 番茄红(高饱和、显眼)
  primaryDark: '#B5342B',
  primaryShadow: '#3D2817',  // 深森林棕(做像素步阶硬阴影)
  secondary: '#3D2817',      // 深森林棕(厚描边)
  bgLight: '#88BC5A',        // 鲜草绿
  bgDark: '#6FA248',         // 深一阶
  textDark: '#3D2817',
  textMuted: '#6B4A2E',
  surface: '#FBE8A6',        // Stardew 信纸黄
  /** 玩法状态色 */
  tap: '#4FA3D8',            // 鲜天空蓝
  hold: '#E89B5A',           // 橙
  hold2: '#7CC76E',          // 草绿(蓄力进度环)
  /** 判定色 — 像素游戏的鲜艳判定 */
  perfect: '#5BBF4A',
  good: '#F2C84B',
  miss: '#E84A3F',
  combo: '#F26BAE',
  success: '#5BBF4A',
  warning: '#F2A03A',
} as const;

/* ------------------------------------------------------------------ */
/* 字体                                                                 */
/* ------------------------------------------------------------------ */

export const FONTS = {
  /** 标题字体 — 像素 sans (西文) + 圆润 sans-serif (中文 fallback) */
  display: "'Pixelify Sans', 'Noto Sans SC', sans-serif",
  body: "'Quicksand', 'Noto Sans SC', sans-serif",
  numeric: "'Nunito', 'Noto Sans SC', sans-serif",
} as const;

/* ------------------------------------------------------------------ */
/* 玩法常量                                                              */
/* ------------------------------------------------------------------ */

export const GAMEPLAY = {
  /** 一轮传送带出题数 */
  conveyorRoundLength: 15,
  /** 加工台单食材最大切片数 */
  maxSlicesPerIngredient: 5,
  /** 摆盘最少切片数 */
  minSlicesToPlate: 3,
  /** HOLD 长按阈值(ms),低于此判为 tap */
  holdThresholdMs: 250,
} as const;
