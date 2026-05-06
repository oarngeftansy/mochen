import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  GAMEPLAY,
  INGREDIENTS,
  PALETTE,
  FONTS,
  getIngredient,
  type IngredientType,
} from '../../config/assets';
import { SFX, VOLUME } from '../../config/audio';
import type { CollectedIngredient } from '../shared/types';

/** 传送带上的食材实例 (内部状态) */
type ConveyorItem = {
  /** 实例唯一 id */
  id: string;
  /** 引用 INGREDIENTS 配置中的 id */
  ingredientId: string;
  type: IngredientType;
  position: number;
  collected: boolean;
  judged: boolean;
};

type JudgementResult = {
  id: string;
  text: string;
  color: string;
  y: number;
};

const HIT_ZONE_X = 300;
const PERFECT_RANGE = 60;
const GOOD_RANGE = 120;
const MISS_BUFFER = 100;
const SPEED = 3;

export function ConveyorMode({
  onComplete,
  onRestart,
}: {
  onComplete: (ingredients: CollectedIngredient[]) => void;
  onRestart?: () => void;
}) {
  const { t, language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<ConveyorItem[]>([]);
  const [collected, setCollected] = useState<ConveyorItem[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [judgements, setJudgements] = useState<JudgementResult[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const judgedRef = useRef<Set<string>>(new Set());
  const isPressDownRef = useRef(false);

  // 初始化 SFX 池(只加载非空 URL)
  useEffect(() => {
    Object.entries(SFX).forEach(([key, url]) => {
      if (url) {
        const audio = new Audio(url);
        audio.volume = VOLUME.sfx;
        audio.preload = 'auto';
        audioRefs.current[key] = audio;
      }
    });
    return () => {
      Object.values(audioRefs.current).forEach((a) => a.pause());
    };
  }, []);

  // 生成谱面
  useEffect(() => {
    const startX = typeof window !== 'undefined' ? window.innerWidth + 200 : 1200;
    const initial: ConveyorItem[] = Array.from({ length: GAMEPLAY.conveyorRoundLength }).map(
      (_, i) => {
        const cfg = INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)];
        return {
          id: `item-${i}`,
          ingredientId: cfg.id,
          type: cfg.type,
          position: startX + i * 250,
          collected: false,
          judged: false,
        };
      },
    );
    setItems(initial);
  }, []);

  // 传送带移动 + miss 判定
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          if (judgedRef.current.has(it.id)) return { ...it, judged: true };
          if (it.judged) return it;

          const newPos = it.position - SPEED;
          const missThreshold = HIT_ZONE_X - GOOD_RANGE - MISS_BUFFER;
          if (newPos < missThreshold) {
            judgedRef.current.add(it.id);
            setTimeout(() => {
              showJudgement('miss', PALETTE.miss);
              setCombo(0);
            }, 0);
            return { ...it, position: newPos, judged: true };
          }
          return { ...it, position: newPos };
        }),
      );
    }, 16);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HOLD 进度环更新
  useEffect(() => {
    if (!isHolding || holdStartTime == null) return;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - holdStartTime;
      setHoldProgress(Math.min(elapsed / GAMEPLAY.holdThresholdMs, 1));
      if (isHolding) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isHolding, holdStartTime]);

  // 游戏结束判定
  useEffect(() => {
    const allJudged = items.length > 0 && items.every((it) => it.judged);
    if (allJudged && !gameOver) {
      setGameOver(true);
      if (collected.length === 0) {
        playSound('miss');
      } else {
        playSound('complete');
        setTimeout(() => {
          onComplete(
            collected.map((it) => ({
              instanceId: it.id,
              ingredientId: it.ingredientId,
            })),
          );
        }, 1000);
      }
    }
  }, [items, collected, onComplete, gameOver]);

  const playSound = (name: string) => {
    const a = audioRefs.current[name];
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  };

  const showJudgement = (textKey: string, color: string) => {
    const newJudge: JudgementResult = {
      id: `j-${Date.now()}-${Math.random()}`,
      text: t(textKey),
      color,
      y: 200,
    };
    setJudgements((prev) => [...prev, { ...newJudge, y: 200 + prev.length * 80 }]);
    if (textKey === 'perfect') playSound('perfect');
    else if (textKey === 'good') playSound('good');
    else if (textKey === 'miss') playSound('miss');
    setTimeout(() => {
      setJudgements((prev) => prev.filter((j) => j.id !== newJudge.id));
    }, 1000);
  };

  const checkHit = (item: ConveyorItem): boolean => {
    const distance = Math.abs(item.position - HIT_ZONE_X);
    if (distance < PERFECT_RANGE) {
      showJudgement('perfect', PALETTE.perfect);
      setScore((s) => s + 100);
      setCombo((c) => c + 1);
      return true;
    }
    if (distance < GOOD_RANGE) {
      showJudgement('good', PALETTE.good);
      setScore((s) => s + 50);
      setCombo((c) => c + 1);
      return true;
    }
    return false;
  };

  const handleAction = (kind: IngredientType) => {
    const candidates = items.filter(
      (it) =>
        !judgedRef.current.has(it.id) &&
        it.type === kind &&
        Math.abs(it.position - HIT_ZONE_X) < GOOD_RANGE + MISS_BUFFER,
    );
    if (candidates.length === 0) return;

    const closest = candidates.reduce((a, b) =>
      Math.abs(b.position - HIT_ZONE_X) < Math.abs(a.position - HIT_ZONE_X) ? b : a,
    );
    judgedRef.current.add(closest.id);
    playSound(kind);

    const hit = checkHit(closest);
    setItems((prev) =>
      prev.map((it) =>
        it.id === closest.id ? { ...it, collected: hit, judged: true } : it,
      ),
    );
    if (hit) setCollected((prev) => [...prev, closest]);
  };

  const handlePressStart = useCallback(() => {
    if (gameOver || isPressDownRef.current) return;
    isPressDownRef.current = true;
    setIsHolding(true);
    setHoldStartTime(Date.now());
  }, [gameOver]);

  const handlePressEnd = useCallback(() => {
    if (!isPressDownRef.current || holdStartTime == null) return;
    isPressDownRef.current = false;
    const duration = Date.now() - holdStartTime;
    handleAction(duration < GAMEPLAY.holdThresholdMs ? 'tap' : 'hold');
    setIsHolding(false);
    setHoldStartTime(null);
    setHoldProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdStartTime]);

  // 键盘 (空格)
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePressStart();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePressEnd();
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [handlePressStart, handlePressEnd]);

  return (
    <div className="size-full relative" style={{ background: 'var(--game-bg-gradient)' }}>
      {/* 顶部 HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <ScoreCard label={t('score')} value={score} valueColor={PALETTE.primary} />
            <ScoreCard
              label={t('combo')}
              value={combo}
              valueColor={combo > 0 ? PALETTE.combo : '#999'}
            />
          </div>

          <div
            className="px-6 py-3 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: `2px solid ${PALETTE.secondary}`,
              marginRight: '120px', // 给 LanguageToggle 让位
              fontFamily: FONTS.body,
              fontSize: '1rem',
              fontWeight: 600,
              color: PALETTE.textDark,
            }}
            aria-label="操作提示"
          >
            <span className="mr-4">{t('tapControl')}</span>
            <span>{t('holdControl')}</span>
          </div>
        </div>
      </div>

      {/* 判定结果显示 */}
      <AnimatePresence>
        {judgements.map((j) => (
          <motion.div
            key={j.id}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-30"
            style={{
              top: `${j.y}px`,
              fontFamily: FONTS.display,
              fontSize: '3.5rem',
              fontWeight: 800,
              color: j.color,
              textShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: 1.2, opacity: 1, y: -60 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-live="polite"
          >
            {j.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 传送带轨道 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-full"
        style={{
          height: '200px',
          background: 'rgba(0,0,0,0.15)',
          borderTop: '4px solid rgba(255,255,255,0.2)',
          borderBottom: '4px solid rgba(255,255,255,0.2)',
        }}
      >
        {/* 传送带条纹 */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-full w-12 bg-white/10"
              style={{ left: `${i * 60}px` }}
              animate={reduceMotion ? undefined : { x: [-60, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        {/* 判定圈 */}
        <HitZone holdProgress={holdProgress} isHolding={isHolding} reduceMotion={!!reduceMotion} />

        {/* 食材 */}
        {items.map((item) => {
          if (item.judged) return null;
          const cfg = getIngredient(item.ingredientId);
          if (!cfg) return null;

          return (
            <motion.div
              key={item.id}
              className="absolute top-1/2 -translate-y-1/2 select-none pointer-events-none"
              style={{ left: `${item.position}px` }}
            >
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {cfg.imageWhole ? (
                    <img
                      src={cfg.imageWhole}
                      alt={cfg.name[language]}
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
                      }}
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={cfg.name[language]}
                      style={{
                        fontSize: '5rem',
                        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
                      }}
                    >
                      {cfg.emoji}
                    </div>
                  )}
                </motion.div>

                <div
                  className="mt-2 px-4 py-1 rounded-full"
                  style={{
                    background: item.type === 'tap' ? PALETTE.tap : PALETTE.hold,
                    fontFamily: FONTS.body,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#2D3436',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {item.type === 'tap' ? 'TAP' : 'HOLD'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部收集显示 */}
      <div
        className="absolute bottom-32 left-1/2 -translate-x-1/2 px-8 py-4 rounded-3xl z-20"
        style={{
          background: 'rgba(255,255,255,0.85)',
          border: `2px solid ${PALETTE.secondary}`,
        }}
      >
        <div
          className="text-center mb-3"
          style={{
            fontFamily: FONTS.body,
            fontSize: '1rem',
            fontWeight: 700,
            color: PALETTE.textDark,
          }}
        >
          {t('collected')}: {collected.length}
        </div>
        <div className="flex gap-3">
          {collected.slice(-8).map((it) => {
            const cfg = getIngredient(it.ingredientId);
            if (!cfg) return null;
            return (
              <motion.div
                key={it.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {cfg.imageWhole ? (
                  <img
                    src={cfg.imageWhole}
                    alt={cfg.name[language]}
                    style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                  />
                ) : (
                  <div role="img" aria-label={cfg.name[language]} style={{ fontSize: '2.5rem' }}>
                    {cfg.emoji}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 移动端触屏按钮 (无键盘 fallback) */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <button
          type="button"
          className="pointer-events-auto select-none touch-manipulation"
          onPointerDown={(e) => {
            e.preventDefault();
            handlePressStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            handlePressEnd();
          }}
          onPointerCancel={() => handlePressEnd()}
          onPointerLeave={() => {
            if (isPressDownRef.current) handlePressEnd();
          }}
          aria-label={t('pressHint')}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: isHolding
              ? `radial-gradient(circle, ${PALETTE.hold2} 0%, ${PALETTE.primary} 100%)`
              : `radial-gradient(circle, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            border: `4px solid ${PALETTE.secondary}`,
            boxShadow: '0 6px 0 var(--game-primary-shadow), 4px 4px 0 rgba(139,69,19,0.3)',
            cursor: 'pointer',
            color: '#FFF',
            fontFamily: FONTS.display,
            fontSize: '1.25rem',
            fontWeight: 800,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isHolding ? 'HOLD' : 'TAP'}
        </button>
      </div>

      {/* 游戏结束 */}
      {gameOver && collected.length === 0 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-[60]"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-title"
        >
          <motion.div
            className="p-12 text-center rounded-3xl"
            style={{
              background: PALETTE.surface,
              border: `4px solid ${PALETTE.secondary}`,
              boxShadow: '6px 6px 0 rgba(139,69,19,0.3)',
              maxWidth: '500px',
            }}
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <h2
              id="gameover-title"
              className="mb-6"
              style={{
                fontFamily: FONTS.display,
                fontSize: '3rem',
                fontWeight: 800,
                color: PALETTE.primary,
              }}
            >
              {t('gameOver')}
            </h2>
            <p
              className="mb-8"
              style={{
                fontFamily: FONTS.body,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: PALETTE.textDark,
                lineHeight: 1.6,
              }}
            >
              {t('noIngredients')}
              <br />
              {t('tryAgain')}
            </p>
            <div
              className="mb-10"
              style={{
                fontFamily: FONTS.numeric,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: PALETTE.primary,
              }}
            >
              {t('finalScore')}: {score}
            </div>
            <motion.button
              onClick={() => onRestart?.()}
              type="button"
              style={{
                fontFamily: FONTS.display,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'var(--game-primary-gradient)',
                padding: '1rem 3rem',
                border: `3px solid ${PALETTE.secondary}`,
                borderRadius: '100px',
                cursor: 'pointer',
                boxShadow: `0 6px 0 ${PALETTE.primaryShadow}, 4px 4px 0 rgba(139,69,19,0.3)`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('restart')}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor: string;
}) {
  return (
    <motion.div
      className="px-6 py-3 rounded-2xl"
      style={{
        background: PALETTE.surface,
        border: `3px solid ${PALETTE.secondary}`,
        boxShadow: '3px 3px 0 rgba(139,69,19,0.2)',
      }}
      whileHover={{ scale: 1.05 }}
    >
      <div
        style={{
          fontFamily: FONTS.numeric,
          fontSize: '0.875rem',
          fontWeight: 700,
          color: PALETTE.secondary,
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONTS.numeric,
          fontSize: '2rem',
          fontWeight: 900,
          color: valueColor,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </motion.div>
  );
}

function HitZone({
  holdProgress,
  isHolding,
  reduceMotion,
}: {
  holdProgress: number;
  isHolding: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 z-10" style={{ left: `${HIT_ZONE_X}px` }}>
      {/* 外圈脉冲 */}
      {!reduceMotion && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        >
          <div
            className="rounded-full"
            style={{ width: '160px', height: '160px', border: `4px solid ${PALETTE.primary}` }}
          />
        </motion.div>
      )}

      {/* 主判定圈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="rounded-full"
          style={{
            width: '140px',
            height: '140px',
            background:
              'radial-gradient(circle, rgba(231,76,60,0.2) 0%, rgba(231,76,60,0) 70%)',
            border: `6px solid ${PALETTE.primary}`,
            boxShadow: '0 0 20px rgba(231,76,60,0.4)',
          }}
        />
      </div>

      {/* HOLD 蓄力进度环 (IxD gesture-feedback) */}
      {isHolding && (
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          width="160"
          height="160"
          style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
        >
          <circle
            cx="80"
            cy="80"
            r="74"
            fill="none"
            stroke={PALETTE.hold2}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 74}
            strokeDashoffset={(1 - holdProgress) * 2 * Math.PI * 74}
            style={{ filter: 'drop-shadow(0 0 8px rgba(129,255,164,0.8))' }}
          />
        </svg>
      )}

      {/* 中心指示点 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="rounded-full"
          style={{
            width: '12px',
            height: '12px',
            background: '#FFF',
            boxShadow: '0 0 20px rgba(255,255,255,0.8)',
          }}
          animate={reduceMotion ? undefined : { scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
