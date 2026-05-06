/**
 * 音频资源替换中心 (Single Source of Truth)
 *
 * 替换音乐/音效只改这个文件:
 * - BGM: 改 BGM 对象 (按游戏阶段分)
 * - 音效: 改 SFX 对象 (按事件分)
 *
 * 规则:
 * - 留空字符串 ''  = 不播放该音频(组件会跳过,不报错)。
 * - 不要写 'YOUR_XXX_URL' 之类占位符,会被当成有效 URL 然后加载失败。
 * - URL 必须是直接指向音频文件的链接 (.mp3/.ogg/.wav),不能是网盘下载页。
 *   ✅ https://example.com/track.mp3
 *   ❌ https://workupload.com/file/xxx (这是网页,不是音频)
 *
 * 推荐免费音频源:
 * - https://freesound.org/  (CC 协议音效)
 * - https://incompetech.com/  (Kevin MacLeod 免费 BGM)
 * - https://pixabay.com/sound-effects/
 */

/* ------------------------------------------------------------------ */
/* 背景音乐 (BGM) — 循环播放,按游戏阶段切换                                */
/* ------------------------------------------------------------------ */

export const BGM = {
  /** 传送带音游模式背景音乐 */
  conveyor: 'https://files.catbox.moe/udl7fd.mp3',

  /** 加工台模式背景音乐 */
  processing: '',

  /** 结算屏背景音乐(可选,留空则静音) */
  results: '',
} as const;

/* ------------------------------------------------------------------ */
/* 音效 (SFX) — 单次触发,按事件分类                                       */
/* ------------------------------------------------------------------ */

export const SFX = {
  /* === 传送带模式 === */
  /** 快按收集 TAP 食材 */
  tap: '',
  /** 长按收集 HOLD 食材 */
  hold: '',
  /** Perfect 判定 */
  perfect: '',
  /** Good 判定 */
  good: '',
  /** Miss 判定 */
  miss: '',

  /* === 加工台模式 === */
  /** 切菜划线完成 */
  cut: '',
  /** 摆盘动画开始 */
  plate: '',

  /* === 通用 === */
  /** 一轮全部完成时的成功音 */
  complete: '',
  /** UI 按钮点击(可选,留空= 不响) */
  buttonClick: '',
} as const;

/* ------------------------------------------------------------------ */
/* 全局音量(0~1)                                                       */
/* ------------------------------------------------------------------ */

export const VOLUME = {
  bgm: 0.3,
  sfx: 0.5,
} as const;

/* ------------------------------------------------------------------ */
/* 兼容层 — 保留 AUDIO 名称,内部聚合 BGM + SFX                              */
/* ------------------------------------------------------------------ */

export const AUDIO = {
  bgm: BGM,
  sfx: SFX,
  volume: VOLUME,
} as const;

export type SfxKey = keyof typeof SFX;
export type BgmKey = keyof typeof BGM;
