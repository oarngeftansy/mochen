/**
 * 跨屏共享类型 — 各屏幕通过 ingredientId 引用 src/config/assets.ts 中的食材定义。
 */

/** 一个被收集的食材实例 (传送带 → 加工台传递) */
export type CollectedIngredient = {
  /** 实例唯一 ID,游戏内不重复 */
  instanceId: string;
  /** 引用 INGREDIENTS 中的 id */
  ingredientId: string;
};
