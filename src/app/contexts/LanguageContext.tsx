import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

type TranslationValues = Record<string, string | number>;

type Translations = {
  [key: string]: {
    zh: string;
    en: string;
  };
};

const translations: Translations = {
  // 开始画面
  gameTitle: { zh: '烹饪模拟器', en: 'Cook Simulator' },
  gameSubtitle: {
    zh: '像太鼓达人一样收集食材,然后切片摆盘!',
    en: 'Collect ingredients rhythm-game style, then slice & plate!',
  },
  startGame: { zh: '开始游戏', en: 'Start Game' },
  startHint: {
    zh: '点击按钮开始你的美食之旅!',
    en: 'Click to start your culinary journey!',
  },

  // 通用
  restart: { zh: '重新开始', en: 'Restart' },
  pressHint: {
    zh: '按住或点击收集食材',
    en: 'Tap or hold to collect',
  },

  // 传送带模式
  conveyorMode: { zh: '食材音游模式', en: 'Rhythm Mode' },
  score: { zh: '分数', en: 'Score' },
  combo: { zh: '连击', en: 'Combo' },
  tapControl: { zh: '快按收集', en: 'Tap to collect' },
  holdControl: { zh: '长按收集', en: 'Hold to collect' },
  collected: { zh: '已收集', en: 'Collected' },
  gameOver: { zh: '游戏结束', en: 'Game Over' },
  noIngredients: { zh: '一个食材都没收集到!', en: 'No ingredients collected!' },
  tryAgain: { zh: '再试一次吧!', en: 'Try again!' },
  finalScore: { zh: '最终分数', en: 'Final Score' },

  // 加工台模式
  processingMode: { zh: '加工台模式', en: 'Processing Mode' },
  processingProgress: { zh: '加工进度', en: 'Processing' },
  cuttingBoardLabel: { zh: '切菜板,在此区域内拖动鼠标切片', en: 'Cutting board, drag to slice' },
  dragToCut: { zh: '按住鼠标拖动切', en: 'Drag mouse to slice' },
  sliceProgress: { zh: '已切', en: 'Sliced' },
  slicing: { zh: '划线中...', en: 'Slicing...' },
  horizontalCut: { zh: '➡ 横切', en: '➡ Horizontal' },
  verticalCut: { zh: '⬇ 竖切', en: '⬇ Vertical' },
  diagonalCut: { zh: '↘ 斜切', en: '↘ Diagonal' },
  plating: { zh: '正在摆盘...', en: 'Plating...' },
  selectSlices: { zh: '选择切片摆盘', en: 'Select slices to plate' },
  confirmPlating: { zh: '确认摆盘', en: 'Confirm plating' },
  completedPlates: { zh: '已完成', en: 'Completed' },
  continueSlicing: { zh: '继续切片', en: 'Continue slicing' },
  nextIngredient: { zh: '下一个食材', en: 'Next ingredient' },
  finishAll: { zh: '完成', en: 'Finish' },
  sliceLimitReached: { zh: '已达上限', en: 'Limit reached' },
  /** {count} 片 / {count} slice(s) */
  slicesCount: { zh: '{count} 片', en: '{count} slice{plural}' },

  // 结算
  resultsTitle: { zh: '完美完成!', en: 'Perfect!' },
  /** {plates} 道菜 / {slices} 片食材 */
  resultsSummary: {
    zh: '共完成 {plates} 道菜肴,{slices} 片食材',
    en: '{plates} dish{platePlural} · {slices} slice{slicePlural}',
  },

  // 判定
  perfect: { zh: 'PERFECT!', en: 'PERFECT!' },
  good: { zh: 'GOOD', en: 'GOOD' },
  miss: { zh: 'MISS', en: 'MISS' },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** 翻译。values 内的占位符 {key} 会被替换。 */
  t: (key: string, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/** 把 {key} 占位符替换成 values[key]。同时支持简单复数(英文 plural 后缀) */
function interpolate(template: string, values: TranslationValues, lang: Language): string {
  // 自动注入英文复数后缀 (slice -> slices)
  const enriched: TranslationValues = { ...values };
  if (lang === 'en' && typeof values.count === 'number') {
    enriched.plural = values.count === 1 ? '' : 's';
  }
  if (lang === 'en' && typeof values.plates === 'number') {
    enriched.platePlural = values.plates === 1 ? '' : 'es';
  }
  if (lang === 'en' && typeof values.slices === 'number') {
    enriched.slicePlural = values.slices === 1 ? '' : 's';
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = enriched[key];
    return v !== undefined ? String(v) : `{${key}}`;
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: string, values?: TranslationValues): string => {
    const tpl = translations[key]?.[language];
    if (!tpl) return key;
    return values ? interpolate(tpl, values, language) : tpl;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
