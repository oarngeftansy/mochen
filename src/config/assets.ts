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

import watermelonPx from '../assets/pixel/watermelon.svg';
import tomatoPx from '../assets/pixel/tomato.svg';
import cucumberPx from '../assets/pixel/cucumber.svg';
import carrotPx from '../assets/pixel/carrot.svg';
import eggplantPx from '../assets/pixel/eggplant.svg';

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
    imageWhole: watermelonPx,
    imageSliced: watermelonPx,
  },
  {
    id: 'tomato',
    name: { zh: '番茄', en: 'Tomato' },
    emoji: '🍅',
    type: 'tap',
    imageWhole: tomatoPx,
    imageSliced: tomatoPx,
  },
  {
    id: 'cucumber',
    name: { zh: '黄瓜', en: 'Cucumber' },
    emoji: '🥒',
    type: 'hold',
    imageWhole: cucumberPx,
    imageSliced: cucumberPx,
  },
  {
    id: 'carrot',
    name: { zh: '胡萝卜', en: 'Carrot' },
    emoji: '🥕',
    type: 'tap',
    imageWhole: carrotPx,
    imageSliced: carrotPx,
  },
  {
    id: 'eggplant',
    name: { zh: '茄子', en: 'Eggplant' },
    emoji: '🍆',
    type: 'hold',
    imageWhole: eggplantPx,
    imageSliced: eggplantPx,
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
 * 游戏调色板 — Candy Pop 像素风 (鲜艳 / 活泼 / 任天堂风):
 * - 高饱和天空蓝背景(像 Mario / Kirby 天空)
 * - 深紫黑厚描边 + 像素步阶硬阴影
 * - 番茄红主 CTA / 蛋黄 / 草绿 / 樱粉 多色点缀
 * - 奶油黄卡片
 */
export const PALETTE = {
  primary: '#FF5252',        // 鲜番茄红(高饱和)
  primaryDark: '#D63838',
  primaryShadow: '#2D1B36',  // 深紫黑(像素步阶硬阴影色)
  secondary: '#2D1B36',      // 深紫黑(厚描边)
  bgLight: '#5BC0F0',        // 鲜天空蓝(Mario sky)
  bgDark: '#4FA8DB',         // 蓝深一阶
  textDark: '#2D1B36',
  textMuted: '#6B5570',
  surface: '#FFF6D5',        // 奶油黄
  /** 玩法状态色 */
  tap: '#FFC93C',            // 金黄(TAP)
  hold: '#FF6B9D',           // 樱粉(HOLD)
  hold2: '#7FE388',          // 鲜草绿(蓄力环)
  /** 判定色 */
  perfect: '#57E16A',        // 鲜绿
  good: '#FFC93C',           // 金黄
  miss: '#FF5252',           // 红
  combo: '#FF6B9D',          // 粉
  success: '#57E16A',
  warning: '#FF9F40',
} as const;

/* ------------------------------------------------------------------ */
/* 字体                                                                 */
/* ------------------------------------------------------------------ */

export const FONTS = {
  /** 标题字体 — 经典像素 (Press Start 2P 西文) + ZCOOL KuaiLe (中文像素感圆体) */
  display: "'Press Start 2P', 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif",
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
