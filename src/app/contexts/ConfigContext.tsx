import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  INGREDIENTS as DEFAULT_INGREDIENTS,
  PALETTE as DEFAULT_PALETTE,
  FONTS as DEFAULT_FONTS,
  type IngredientConfig,
} from '../../config/assets';
import {
  BGM as DEFAULT_BGM,
  SFX as DEFAULT_SFX,
  VOLUME as DEFAULT_VOLUME,
} from '../../config/audio';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type Palette = Record<keyof typeof DEFAULT_PALETTE, string>;
export type Fonts = Record<keyof typeof DEFAULT_FONTS, string>;
export type Bgm = Record<keyof typeof DEFAULT_BGM, string>;
export type Sfx = Record<keyof typeof DEFAULT_SFX, string>;
export type Volume = { bgm: number; sfx: number };

type ConfigState = {
  ingredients: IngredientConfig[];
  palette: Palette;
  fonts: Fonts;
  bgm: Bgm;
  sfx: Sfx;
  volume: Volume;
};

type ConfigContextValue = ConfigState & {
  setIngredients: (next: IngredientConfig[]) => void;
  setPaletteKey: (key: keyof Palette, value: string) => void;
  setFontKey: (key: keyof Fonts, value: string) => void;
  setBgmKey: (key: keyof Bgm, value: string) => void;
  setSfxKey: (key: keyof Sfx, value: string) => void;
  setVolumeKey: (key: keyof Volume, value: number) => void;
  reset: () => void;
  exportTs: () => string;
};

const ConfigContext = createContext<ConfigContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Defaults helper                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'game-config-overrides:v1';

function getDefaults(): ConfigState {
  return {
    ingredients: DEFAULT_INGREDIENTS.map((i) => ({ ...i, name: { ...i.name } })),
    palette: { ...DEFAULT_PALETTE } as Palette,
    fonts: { ...DEFAULT_FONTS } as Fonts,
    bgm: { ...DEFAULT_BGM } as Bgm,
    sfx: { ...DEFAULT_SFX } as Sfx,
    volume: { ...DEFAULT_VOLUME },
  };
}

function loadStored(): ConfigState {
  if (typeof window === 'undefined') return getDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw) as Partial<ConfigState>;
    const def = getDefaults();
    return {
      ingredients: parsed.ingredients ?? def.ingredients,
      palette: { ...def.palette, ...(parsed.palette ?? {}) },
      fonts: { ...def.fonts, ...(parsed.fonts ?? {}) },
      bgm: { ...def.bgm, ...(parsed.bgm ?? {}) },
      sfx: { ...def.sfx, ...(parsed.sfx ?? {}) },
      volume: { ...def.volume, ...(parsed.volume ?? {}) },
    };
  } catch {
    return getDefaults();
  }
}

/* ------------------------------------------------------------------ */
/* CSS-variable sync                                                    */
/* ------------------------------------------------------------------ */

/** palette key -> CSS variable name (matches theme.css). */
const PALETTE_VAR_MAP: Record<keyof Palette, string> = {
  primary: '--game-primary',
  primaryDark: '--game-primary-dark',
  primaryShadow: '--game-primary-shadow',
  secondary: '--game-secondary',
  bgLight: '--game-bg-light',
  bgDark: '--game-bg-dark',
  textDark: '--game-text-dark',
  textMuted: '--game-text-muted',
  surface: '--game-surface',
  tap: '--game-tap',
  hold: '--game-hold',
  hold2: '--game-hold-2',
  perfect: '--game-perfect',
  good: '--game-good',
  miss: '--game-miss',
  combo: '--game-combo',
  success: '--game-success',
  warning: '--game-warning',
};

const FONT_VAR_MAP: Record<keyof Fonts, string> = {
  display: '--font-display',
  body: '--font-body',
  numeric: '--font-numeric',
};

function applyToCssVars(palette: Palette, fonts: Fonts) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  (Object.keys(palette) as (keyof Palette)[]).forEach((k) => {
    root.style.setProperty(PALETTE_VAR_MAP[k], palette[k]);
  });
  (Object.keys(fonts) as (keyof Fonts)[]).forEach((k) => {
    root.style.setProperty(FONT_VAR_MAP[k], fonts[k]);
  });
}

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfigState>(() => loadStored());

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 配额满了之类的,忽略
    }
  }, [state]);

  // 同步 CSS 变量
  useEffect(() => {
    applyToCssVars(state.palette, state.fonts);
  }, [state.palette, state.fonts]);

  const value = useMemo<ConfigContextValue>(
    () => ({
      ...state,
      setIngredients: (next) => setState((s) => ({ ...s, ingredients: next })),
      setPaletteKey: (key, val) =>
        setState((s) => ({ ...s, palette: { ...s.palette, [key]: val } })),
      setFontKey: (key, val) =>
        setState((s) => ({ ...s, fonts: { ...s.fonts, [key]: val } })),
      setBgmKey: (key, val) =>
        setState((s) => ({ ...s, bgm: { ...s.bgm, [key]: val } })),
      setSfxKey: (key, val) =>
        setState((s) => ({ ...s, sfx: { ...s.sfx, [key]: val } })),
      setVolumeKey: (key, val) =>
        setState((s) => ({ ...s, volume: { ...s.volume, [key]: val } })),
      reset: () => setState(getDefaults()),
      exportTs: () => exportTsCode(state),
    }),
    [state],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}

/** 通过 id 查食材(运行时版,从 context state 取) */
export function useIngredient(id: string | undefined): IngredientConfig | undefined {
  const { ingredients } = useConfig();
  if (!id) return undefined;
  return ingredients.find((i) => i.id === id);
}

/* ------------------------------------------------------------------ */
/* Export as TS                                                         */
/* ------------------------------------------------------------------ */

function exportTsCode(state: ConfigState): string {
  const ingredientLines = state.ingredients.map(
    (i) =>
      `  {
    id: ${JSON.stringify(i.id)},
    name: { zh: ${JSON.stringify(i.name.zh)}, en: ${JSON.stringify(i.name.en)} },
    emoji: ${JSON.stringify(i.emoji)},
    type: ${JSON.stringify(i.type)},${i.imageWhole ? `\n    imageWhole: ${JSON.stringify(i.imageWhole)},` : ''}${i.imageSliced ? `\n    imageSliced: ${JSON.stringify(i.imageSliced)},` : ''}
  }`,
  );

  const paletteLines = (Object.keys(state.palette) as (keyof Palette)[]).map(
    (k) => `  ${k}: ${JSON.stringify(state.palette[k])},`,
  );

  const fontLines = (Object.keys(state.fonts) as (keyof Fonts)[]).map(
    (k) => `  ${k}: ${JSON.stringify(state.fonts[k])},`,
  );

  const bgmLines = (Object.keys(state.bgm) as (keyof Bgm)[]).map(
    (k) => `  ${k}: ${JSON.stringify(state.bgm[k])},`,
  );

  const sfxLines = (Object.keys(state.sfx) as (keyof Sfx)[]).map(
    (k) => `  ${k}: ${JSON.stringify(state.sfx[k])},`,
  );

  return `// === src/config/assets.ts (paste the INGREDIENTS / PALETTE / FONTS sections) ===

export const INGREDIENTS: IngredientConfig[] = [
${ingredientLines.join(',\n')},
];

export const PALETTE = {
${paletteLines.join('\n')}
} as const;

export const FONTS = {
${fontLines.join('\n')}
} as const;


// === src/config/audio.ts (paste the BGM / SFX / VOLUME sections) ===

export const BGM = {
${bgmLines.join('\n')}
} as const;

export const SFX = {
${sfxLines.join('\n')}
} as const;

export const VOLUME = {
  bgm: ${state.volume.bgm},
  sfx: ${state.volume.sfx},
} as const;
`;
}
